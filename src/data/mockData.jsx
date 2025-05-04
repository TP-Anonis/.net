// Dữ liệu giả lập cho bài viết
const mockArticles = [
    {
      id: 1,
      title: 'Tin tức thế giới hôm nay',
      summary: 'Cập nhật các sự kiện nổi bật trên thế giới trong ngày.',
      content: 'Nội dung chi tiết về tin tức thế giới...',
      thumbnail: 'https://placehold.co/400x300?text=Image1',
      category: 'Thế giới',
      publishedAt: '2025-03-19T10:00:00Z',
      authorId: 'editor1',
      views: 1500,
      comments: [
        { id: 1, text: 'Bài viết rất hay!', author: 'reader1', createdAt: '2025-03-19T11:00:00Z' },
      ],
    },
    {
      id: 2,
      title: 'Cập nhật thị trường chứng khoán',
      summary: 'Phân tích thị trường chứng khoán hôm nay.',
      content: 'Nội dung chi tiết về thị trường chứng khoán...',
      thumbnail: 'https://placehold.co/400x300?text=Image2',
      category: 'Kinh doanh',
      publishedAt: '2025-03-18T09:00:00Z',
      authorId: 'editor2',
      views: 1200,
      comments: [
        { id: 2, text: 'Cảm ơn bài viết hữu ích!', author: 'reader2', createdAt: '2025-03-18T10:00:00Z' },
      ],
    },
  ];
  
  // Dữ liệu giả lập cho độc giả
  const mockReaders = [
    {
      id: 'reader1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      phone: '0901234567',
      status: 'active',
    },
    {
      id: 'reader2',
      name: 'Trần Thị B',
      email: 'tranthib@example.com',
      phone: '0909876543',
      status: 'suspended',
    },
    {
      id: 'reader3',
      name: 'Lê Văn C',
      email: 'levanc@example.com',
      phone: '0912345678',
      status: 'disabled',
    },
  ];
  
  // Dữ liệu giả lập cho biên tập viên
  const mockEditors = [
    {
      id: 'editor1',
      name: 'Phạm Thị D',
      email: 'phamthid@example.com',
      phone: '0923456789',
      status: 'active',
      articles: mockArticles.filter((article) => article.authorId === 'editor1'),
    },
    {
      id: 'editor2',
      name: 'Hoàng Văn E',
      email: 'hoangvane@example.com',
      phone: '0934567890',
      status: 'active',
      articles: mockArticles.filter((article) => article.authorId === 'editor2'),
    },
  ];
  
  // Export mặc định
  export default mockArticles;
  
  // Named exports (tùy chọn, nếu bạn vẫn cần sử dụng ở nơi khác)
  export { mockArticles, mockReaders, mockEditors };