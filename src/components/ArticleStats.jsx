import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { FaEye, FaComment } from 'react-icons/fa';

// CSS tùy chỉnh (giữ nguyên)
const styles = `
  .article-stats-table {
    table-layout: fixed;
    width: 100%;
  }
  .article-stats-table thead th {
    background-color: #007bff;
    color: white;
    font-weight: 600;
    text-align: center;
  }
  .article-stats-table tbody tr {
    transition: background-color 0.3s ease;
  }
  .article-stats-table tbody tr:hover {
    background-color: #f1faff;
  }
  .article-stats-table td {
    vertical-align: middle;
    text-align: center;
  }
  .article-stats-table th:nth-child(1),
  .article-stats-table td:nth-child(1) {
    width: 5%;
  }
  .article-stats-table th:nth-child(2),
  .article-stats-table td:nth-child(2) {
    width: 30%;
  }
  .article-stats-table th:nth-child(3),
  .article-stats-table td:nth-child(3) {
    width: 15%;
  }
  .article-stats-table th:nth-child(4),
  .article-stats-table td:nth-child(4) {
    width: 15%;
  }
  .article-stats-table th:nth-child(5),
  .article-stats-table td:nth-child(5) {
    width: 15%;
  }
  .article-stats-table th:nth-child(6),
  .article-stats-table td:nth-child(6) {
    width: 20%;
    min-width: 259px;
  }
  .article-stats-table .title-column {
    text-align: left;
    font-weight: 500;
    color: #007bff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .article-stats-table .title-column a {
    text-decoration: none;
    color: #007bff;
  }
  .article-stats-table .title-column a:hover {
    text-decoration: underline;
    color: #0056b3;
  }
  .article-stats-table .interaction-column {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .article-stats-table .interaction-column .views {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #28a745;
    font-weight: 500;
  }
  .article-stats-table .interaction-column .comments {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #dc3545;
    font-weight: 500;
  }
  .article-stats-table .interaction-column svg {
    font-size: 0.9rem;
  }
  .pagination .page-item.active .page-link {
    background-color: #007bff;
    border-color: #007bff;
    color: white;
  }
  .pagination .page-link {
    color: #007bff;
  }
  .pagination .page-link:hover {
    background-color: #e9ecef;
    color: #0056b3;
  }
  .overview-card {
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    background: linear-gradient(145deg, #ffffff, #f0f0f0);
  }
  .overview-card .card-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .overview-card .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }
  .overview-card .card-text {
    font-size: 1.5rem;
    font-weight: bold;
    color: #007bff;
  }
`;

const ArticleStats = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [articles, setArticles] = useState([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const baseUrl = 'http://localhost:8000/article/api/v1/Statistic';
  const pageSize = 15;

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy thống kê bài viết và lượt xem
        const viewStatsResponse = await axios.get(`${baseUrl}/article-view-stats`, {
          params: {
            pageNumber: currentPage,
            pageSize: pageSize,
          },
        });

        const viewStatsData = viewStatsResponse.data.data;
        const articlesWithViews = viewStatsData.items || [];

        // 2. Lấy số lượng bình luận cho từng bài viết
        const commentStatsResponse = await axios.get(`${baseUrl}/article-comment-stats`, {
          params: {
            pageNumber: currentPage,
            pageSize: pageSize,
          },
        });

        const commentStatsData = commentStatsResponse.data.data;
        const articlesWithComments = commentStatsData.items || [];

        // 3. Kết hợp dữ liệu lượt xem và bình luận
        const mergedArticles = articlesWithViews.map((article, index) => ({
          ...article,
          comments: articlesWithComments[index]?.comments || [],
        }));

        // 4. Cập nhật state
        setArticles(mergedArticles);
        setTotalPages(viewStatsData.totalPages || 1);
        setTotalArticles(viewStatsData.totalCount || 0);

        // Tính tổng lượt xem và bình luận
        const views = articlesWithViews.reduce((sum, article) => sum + (article.views || 0), 0);
        const comments = articlesWithComments.reduce(
          (sum, article) => sum + (article.comments?.length || 0),
          0
        );
        setTotalViews(views);
        setTotalComments(comments);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Tạo các nút phân trang
  const renderPagination = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev
          onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Thêm CSS tùy chỉnh */}
      <style>{styles}</style>

      <Header />
      <Container className="my-5 flex-grow-1">
        <h2 className="mb-4 text-center" style={{ color: '#333', fontWeight: 'bold' }}>
          Thống kê bài báo
        </h2>

        {/* Tổng quan */}
        <Row className="mb-4">
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div>
                  <Card.Title>Tổng số bài viết</Card.Title>
                  <Card.Text>{totalArticles}</Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div>
                  <Card.Title>Tổng lượt xem</Card.Title>
                  <Card.Text>{totalViews}</Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="overview-card">
              <Card.Body>
                <div>
                  <Card.Title>Tổng bình luận</Card.Title>
                  <Card.Text>{totalComments}</Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Bảng thống kê */}
        {loading ? (
          <div className="text-center">Đang tải dữ liệu...</div>
        ) : (
          <>
            <Table striped bordered hover responsive className="article-stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tiêu đề</th>
                  <th>Chủ đề</th>
                  <th>Tác giả</th>
                  <th>Ngày xuất bản</th>
                  <th>Lượt Tương tác</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => (
                  <tr key={article.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td className="title-column">
                      <Link to={`/news/${encodeURIComponent(article.title)}`} state={{ article }}>
                        {article.title}
                      </Link>
                    </td>
                    <td>{article.category}</td>
                    <td>{article.authorId}</td>
                    <td>{new Date(article.publishedAt).toLocaleDateString('vi-VN')}</td>
                    <td className="interaction-column">
                      <span className="views">
                        <FaEye /> {article.views || 0}
                      </span>
                      <span className="comments">
                        <FaComment /> {article.comments?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {renderPagination()}
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default ArticleStats;