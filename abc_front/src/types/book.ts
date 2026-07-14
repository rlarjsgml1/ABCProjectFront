// 도서(Book) 상세 정보 관련 타입 정의
export type BookDetail = {
  bookId: number;
  title: string;
  isbn?: string;
  author?: string;
  authors?: string[];
  publisher?: string;
  publisherName?: string;
  description?: string;
  coverImageUrl?: string;
  pubDate?: string;
  publishedAt?: string;
  categories?: {
    categoryId: number;
    parentCategoryId?: number | null;
    categoryName?: string;
    name?: string;
    displayOrder?: number;
  }[];
  categoryName?: string;
  keywords?: string[];
  tableOfContents?: string;
  publisherReview?: string;
  rentalInfo?: {
    rentalType: 'FREE' | 'PAID';
    rentalPrice: number;
    defaultRentalDays: number;
  };
  rentalType?: 'FREE' | 'PAID';
  rentalPrice?: number;
  defaultRentalDays?: number;
  rentalPeriodDays?: number;
  totalPages?: number;
  pageCount?: number;
  status?: string;
  myRentalState?: string | null;
  myFavoriteYn?: boolean;
};
