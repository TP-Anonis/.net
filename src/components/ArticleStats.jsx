import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Card, Row, Col, Tabs, Tab, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { FaEye, FaComment } from 'react-icons/fa';

// CSS tùy chỉnh (giữ nguyên và mở rộng để hỗ trợ form lọc thời gian)
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
  .date-filter-form {
    display: flex;
    gap: 15px;
    align-items: center;
    margin-bottom: 20px;
  }
  .date-filter-form label {
    font-weight: 500;
    color: #333;
  }
`;

const ArticleStats = () => {
  const [activeTab, setActiveTab] = useState('articleViewStats');
  const [articleViewStats, setArticleViewStats] = useState([]);
  const [articleCommentStats, setArticleCommentStats] = useState([]);
  const [userPostStats, setUserPostStats] = useState([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalUserPosts, setTotalUserPosts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State cho phân trang và lọc thời gian
  const [tabStates, setTabStates] = useState({
    articleViewStats: { currentPage: 1, totalPages: 1, startDate: '2024-01-01', endDate: '2025-12-31' },
    articleCommentStats: { currentPage: 1, totalPages: 1, startDate: '2024-01-01', endDate: '2025-12-31' },
    userPostStats: { currentPage: 1, totalPages: 1, startDate: '2024-01-01', endDate: '2025-12-31' },
  });

  const baseUrl = 'http://localhost:8000/article/api/v1/Statistic';
  const pageSize = 15;

  // Lấy dữ liệu từ API dựa trên tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const { startDate, endDate, currentPage } = tabStates[activeTab];
        let response;
        switch (activeTab) {
          case 'articleViewStats':
            response = await axios.get(`${baseUrl}/article-view-stats`, {
              params: {
                publishStartDate: startDate,
                publishEndDate: endDate,
                viewStartDate: startDate,
                viewEndDate: endDate,
                pageNumber: currentPage,
                pageSize: pageSize,
              },
            });
            const viewData = response.data.data;
            setArticleViewStats(viewData.items || []);
            setTotalViews(viewData.items.reduce((sum, item) => sum + (item.views || 0), 0));
            setTotalArticles(viewData.totalCount || 0);
            setTabStates((prev) => ({
              ...prev,
              articleViewStats: { ...prev.articleViewStats, totalPages: viewData.totalPages || 1 },
            }));
            break;

          case 'articleCommentStats':
            response = await axios.get(`${baseUrl}/article-comment-stats`, {
              params: {
                publishStartDate: startDate,
                publishEndDate: endDate,
                commentStartDate: startDate,
                commentEndDate: endDate,
                pageNumber: currentPage,
                pageSize: pageSize,
              },
            });
            const commentData = response.data.data;
            setArticleCommentStats(commentData.items || []);
            setTotalComments(commentData.items.reduce((sum, item) => sum + (item.comments?.length || 0), 0));
            setTotalArticles(commentData.totalCount || 0);
            setTabStates((prev) => ({
              ...prev,
              articleCommentStats: { ...prev.articleCommentStats, totalPages: commentData.totalPages || 1 },
            }));
            break;

          case 'userPostStats':
            response = await axios.get(`${baseUrl}/user-post-stats`, {
              params: {
                startDate: startDate,
                endDate: endDate,
                pageNumber: currentPage,
                pageSize: pageSize,
              },
            });
            const postData = response.data.data;
            setUserPostStats(postData.items || []);
            setTotalUserPosts(postData.totalCount || 0);
            setTabStates((prev) => ({
              ...prev,
              userPostStats: { ...prev.userPostStats, totalPages: postData.totalPages || 1 },
            }));
            break;

          default:
            break;
        }
      } catch (error) {
        setError(`Lỗi khi lấy dữ liệu: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, tabStates[activeTab].currentPage, tabStates[activeTab].startDate, tabStates[activeTab].endDate]);

  // Xử lý thay đổi thời gian
  const handleDateChange = (field, value) => {
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], [field]: value, currentPage: 1 },
    }));
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setTabStates((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], currentPage: page },
    }));
  };

  // Tạo các nút phân trang
  const renderPagination = () => {
    const { currentPage, totalPages } = tabStates[activeTab];
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Render bảng dữ liệu dựa trên tab
  const renderTable = () => {
    let data = [];
    let totalItems = 0;
    const { currentPage } = tabStates[activeTab];

    switch (activeTab) {
      case 'articleViewStats':
        data = articleViewStats;
        totalItems = totalArticles;
        if (data.length === 0) {
          return <Alert variant="info">Không có dữ liệu lượt xem trong khoảng thời gian này.</Alert>;
        }
        return (
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
              {data.map((article, index) => (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );

      case 'articleCommentStats':
        data = articleCommentStats;
        totalItems = totalArticles;
        if (data.length === 0) {
          return <Alert variant="info">Không có dữ liệu bình luận trong khoảng thời gian này.</Alert>;
        }
        return (
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
              {data.map((article, index) => (
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
                    <span className="comments">
                      <FaComment /> {article.comments?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );

      case 'userPostStats':
        data = userPostStats;
        totalItems = totalUserPosts;
        if (data.length === 0) {
          return <Alert variant="info">Không có dữ liệu bài viết người dùng trong khoảng thời gian này.</Alert>;
        }
        return (
          <Table striped bordered hover responsive className="article-stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên người dùng</th>
                <th>Số bài viết</th>
                <th>Ngày cập nhật</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => (
                <tr key={user.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td>{user.userName || 'N/A'}</td>
                  <td>{user.postCount || 0}</td>
                  <td>{new Date(user.lastUpdated).toLocaleDateString('vi-VN')}</td>
                  <td>{user.status || 'Active'}</td>
                  <td>
                    <Link to={`/user/${user.id}`} className="btn btn-primary btn-sm">
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );

      default:
        return null;
    }
  };

  // Render tổng quan dựa trên tab
  const renderOverview = () => {
    switch (activeTab) {
      case 'articleViewStats':
        return (
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
        );
      case 'articleCommentStats':
        return (
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
                    <Card.Title>Tổng bình luận</Card.Title>
                    <Card.Text>{totalComments}</Card.Text>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
      case 'userPostStats':
        return (
          <Row className="mb-4">
            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div>
                    <Card.Title>Tổng số người dùng</Card.Title>
                    <Card.Text>{totalUserPosts}</Card.Text>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
      default:
        return null;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <style>{styles}</style>
      <Header />
      <Container className="my-5 flex-grow-1">
        <h2 className="mb-4 text-center" style={{ color: '#333', fontWeight: 'bold' }}>
          Thống kê
        </h2>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          <Tab eventKey="articleViewStats" title="Thống kê lượt xem" />
          <Tab eventKey="articleCommentStats" title="Thống kê bình luận" />
          <Tab eventKey="userPostStats" title="Thống kê bài viết người dùng" />
        </Tabs>

        <div className="date-filter-form">
          <Form.Group controlId="startDate">
            <Form.Label>Từ ngày</Form.Label>
            <Form.Control
              type="date"
              value={tabStates[activeTab].startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="endDate">
            <Form.Label>Đến ngày</Form.Label>
            <Form.Control
              type="date"
              value={tabStates[activeTab].endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </Form.Group>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {renderOverview()}

        {loading ? (
          <div className="text-center">Đang tải dữ liệu...</div>
        ) : (
          <>
            {renderTable()}
            {tabStates[activeTab].totalPages > 1 && renderPagination()}
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default ArticleStats;