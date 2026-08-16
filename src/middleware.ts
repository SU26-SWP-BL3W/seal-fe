import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Bỏ qua tất cả các đường dẫn chứa dấu chấm (vd: favicon.ico, images)
  // và bỏ qua thư mục api, _next
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
