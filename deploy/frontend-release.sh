#!/usr/bin/env bash

set -euo pipefail
umask 077

if [[ $# -ne 2 ]]; then
    echo "usage: frontend-release.sh <publish|promote> <release-id>" >&2
    exit 2
fi

MODE=$1
RELEASE_ID=$2

: "${AWS_REGION:?AWS_REGION is required}"
: "${FRONTEND_S3_BUCKET:?FRONTEND_S3_BUCKET is required}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?CLOUDFRONT_DISTRIBUTION_ID is required}"
: "${FRONTEND_BASE_URL:?FRONTEND_BASE_URL is required}"
: "${VITE_API_BASE_URL:?VITE_API_BASE_URL is required}"

if [[ ! "$FRONTEND_S3_BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
    echo "invalid frontend bucket name" >&2
    exit 2
fi
if [[ ! "$CLOUDFRONT_DISTRIBUTION_ID" =~ ^[A-Z0-9]+$ ]]; then
    echo "invalid CloudFront distribution ID" >&2
    exit 2
fi
if [[ ! "$FRONTEND_BASE_URL" =~ ^https://[A-Za-z0-9.-]+$ ]]; then
    echo "invalid frontend base URL" >&2
    exit 2
fi
if [[ ! "$VITE_API_BASE_URL" =~ ^https://[A-Za-z0-9.-]+/api/v1$ ]]; then
    echo "invalid production API base URL" >&2
    exit 2
fi
if [[ ! "$RELEASE_ID" =~ ^([0-9a-f]{40}|5b13c6d)$ ]]; then
    echo "release ID must be a full git SHA or the preserved legacy baseline" >&2
    exit 2
fi

RELEASE_PREFIX="releases/${RELEASE_ID}"
CURRENT_PREFIX=current

assert_release_exists() {
    aws s3api head-object \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --key "${RELEASE_PREFIX}/index.html" > /dev/null
}

verify_release_content() {
    local verify_dir
    verify_dir=$(mktemp -d)
    aws s3 sync \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/" \
        "$verify_dir/" \
        --region "$AWS_REGION" \
        --exclude "release-manifest.sha256" \
        --only-show-errors
    if ! diff -qr abc_front/dist "$verify_dir" > /dev/null; then
        rm -rf "$verify_dir"
        echo "remote release content does not match the local build" >&2
        exit 1
    fi
    rm -rf "$verify_dir"
}

publish_release() {
    if [[ ! "$RELEASE_ID" =~ ^[0-9a-f]{40}$ ]]; then
        echo "new releases require a full 40-character git SHA" >&2
        exit 2
    fi
    if [[ ! -f abc_front/dist/index.html ]]; then
        echo "abc_front/dist/index.html is missing" >&2
        exit 1
    fi

    local manifest_file
    local existing_count
    manifest_file=$(mktemp)

    (
        cd abc_front/dist
        find . -type f -print0 | sort -z | xargs -0 sha256sum
    ) > "$manifest_file"

    existing_count=$(aws s3api list-objects-v2 \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --prefix "${RELEASE_PREFIX}/" \
        --max-items 1 \
        --query 'KeyCount' \
        --output text)

    if [[ "$existing_count" != 0 ]]; then
        local remote_manifest
        remote_manifest=$(mktemp)
        if aws s3api head-object \
            --region "$AWS_REGION" \
            --bucket "$FRONTEND_S3_BUCKET" \
            --key "${RELEASE_PREFIX}/release-manifest.sha256" > /dev/null 2>&1; then
            aws s3 cp \
                "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/release-manifest.sha256" \
                "$remote_manifest" \
                --region "$AWS_REGION" \
                --only-show-errors
            if ! cmp -s "$manifest_file" "$remote_manifest"; then
                rm -f "$manifest_file" "$remote_manifest"
                echo "immutable release prefix already exists with different content" >&2
                exit 1
            fi
            verify_release_content
            rm -f "$manifest_file" "$remote_manifest"
            echo "immutable release already exists and matches local manifest"
            return
        fi

        # Manifest는 commit marker다. 없는 prefix는 이전 publish가 중간에 실패한 상태일 수 있다.
        # 기존 object가 local build의 정확한 subset일 때만 deterministic resume를 허용한다.
        local partial_dir
        partial_dir=$(mktemp -d)
        aws s3 sync \
            "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/" \
            "$partial_dir/" \
            --region "$AWS_REGION" \
            --only-show-errors
        while IFS= read -r -d '' partial_file; do
            local relative_path
            relative_path=${partial_file#"$partial_dir/"}
            if [[ ! -f "abc_front/dist/${relative_path}" ]] \
                || ! cmp -s "$partial_file" "abc_front/dist/${relative_path}"; then
                rm -rf "$partial_dir"
                rm -f "$manifest_file" "$remote_manifest"
                echo "partial release contains content outside the local build" >&2
                exit 1
            fi
        done < <(find "$partial_dir" -type f -print0)
        rm -rf "$partial_dir"
        rm -f "$remote_manifest"
    fi

    aws s3 sync \
        abc_front/dist/assets/ \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/assets/" \
        --region "$AWS_REGION" \
        --cache-control "public,max-age=31536000,immutable" \
        --only-show-errors

    aws s3 sync \
        abc_front/dist/ \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/" \
        --region "$AWS_REGION" \
        --exclude "assets/*" \
        --exclude "index.html" \
        --cache-control "no-cache" \
        --only-show-errors

    aws s3 cp \
        abc_front/dist/index.html \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/index.html" \
        --region "$AWS_REGION" \
        --cache-control "no-cache,no-store,must-revalidate" \
        --content-type "text/html" \
        --metadata "release-sha=${RELEASE_ID}" \
        --only-show-errors

    verify_release_content

    # Manifest를 마지막에 올려 release가 완전히 검증됐음을 표시한다.
    aws s3 cp \
        "$manifest_file" \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/release-manifest.sha256" \
        --region "$AWS_REGION" \
        --cache-control "no-cache" \
        --content-type "text/plain" \
        --metadata "release-sha=${RELEASE_ID}" \
        --only-show-errors

    assert_release_exists
    rm -f "$manifest_file"
    echo "immutable release published: ${RELEASE_ID}"
}

promote_release() {
    assert_release_exists

    # 이전 index.html을 가진 browser가 기존 hashed asset을 계속 요청할 수 있으므로
    # current/assets의 오래된 hash는 첫 CD 단계에서 삭제하지 않는다.
    aws s3 sync \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/" \
        "s3://${FRONTEND_S3_BUCKET}/${CURRENT_PREFIX}/" \
        --region "$AWS_REGION" \
        --exclude "index.html" \
        --only-show-errors

    aws s3 cp \
        "s3://${FRONTEND_S3_BUCKET}/${RELEASE_PREFIX}/index.html" \
        "s3://${FRONTEND_S3_BUCKET}/${CURRENT_PREFIX}/index.html" \
        --region "$AWS_REGION" \
        --only-show-errors

    local current_release
    current_release=$(aws s3api head-object \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --key "${CURRENT_PREFIX}/index.html" \
        --query 'Metadata."release-sha"' \
        --output text)
    if [[ "$RELEASE_ID" == 5b13c6d ]]; then
        # 기존 수동 release에는 metadata가 없으므로 legacy rollback에서는 ETag 존재만 확인한다.
        [[ "$current_release" == None || -z "$current_release" ]]
    elif [[ "$current_release" != "$RELEASE_ID" ]]; then
        echo "current/index.html release metadata does not match" >&2
        exit 1
    fi

    local invalidation_id
    invalidation_id=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --id "$invalidation_id"

    local path
    for path in / /login /books; do
        curl --fail --silent --show-error \
            --retry 6 --retry-delay 5 --retry-all-errors \
            --max-time 15 \
            "${FRONTEND_BASE_URL}${path}" > /dev/null
    done

    local index_cache
    local asset_key
    local asset_cache
    index_cache=$(aws s3api head-object \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --key "${CURRENT_PREFIX}/index.html" \
        --query 'CacheControl' \
        --output text)
    [[ "$index_cache" == "no-cache,no-store,must-revalidate" ]]

    asset_key=$(aws s3api list-objects-v2 \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --prefix "${CURRENT_PREFIX}/assets/" \
        --max-keys 20 \
        --no-paginate \
        --query 'Contents[?Size > `0`] | [0].Key' \
        --output text)
    if [[ -z "$asset_key" || "$asset_key" == None ]]; then
        echo "current release does not contain a cacheable asset" >&2
        exit 1
    fi
    asset_cache=$(aws s3api head-object \
        --region "$AWS_REGION" \
        --bucket "$FRONTEND_S3_BUCKET" \
        --key "$asset_key" \
        --query 'CacheControl' \
        --output text)
    [[ "$asset_cache" == "public,max-age=31536000,immutable" ]]

    local origin
    for origin in "https://portfoliodev.click" "https://www.portfoliodev.click"; do
        local headers_file
        headers_file=$(mktemp)
        curl --silent --show-error \
            --request OPTIONS \
            --dump-header "$headers_file" \
            --output /dev/null \
            --header "Origin: ${origin}" \
            --header "Access-Control-Request-Method: GET" \
            --header "Access-Control-Request-Headers: authorization" \
            "${VITE_API_BASE_URL}/categories"
        tr -d '\r' < "$headers_file" | grep -Fqi "access-control-allow-origin: ${origin}"
        rm -f "$headers_file"
    done

    echo "release promoted: ${RELEASE_ID}"
    echo "CloudFront invalidation: ${invalidation_id}"
}

case "$MODE" in
    publish)
        publish_release
        ;;
    promote)
        promote_release
        ;;
    *)
        echo "unsupported mode: $MODE" >&2
        exit 2
        ;;
esac
