// 도서(Book) 상세 정보 관련 타입 정의
export type BookDetail = {
  bookId: number;
  title: string;
  author: string;
  publisher: string;
  description: string;
  coverImageUrl: string;
  rentalType: 'FREE' | 'PAID';
  status: string;
};