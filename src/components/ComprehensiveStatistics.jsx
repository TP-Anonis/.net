import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Nav, Tab, Alert, Table, Form, Pagination, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import { FaEye, FaComment } from 'react-icons/fa';
import Header from './Header';
import Footer from './Footer';

// Đăng ký các thành phần Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Kiểu CSS
const styles = `
  .stats-table {
    table-layout: fixed;
    width: 100%;
  }
  .stats-table thead th {
    background-color: #007bff;
    color: white;
    font-weight: 600;
    text-align: center;
  }
  .stats-table tbody tr {
    transition: background-color 0.3s ease;
  }
  .stats-table tbody tr:hover {
    background-color: #f1faff;
  }
  .stats-table td {
    vertical-align: middle;
    text-align: center;
  }
  .stats-table th:nth-child(1), .stats-table td:nth-child(1) { width: 5%; }
  .stats-table th:nth-child(2), .stats-table td:nth-child(2) { width: 30%; }
  .stats-table th:nth-child(3), .stats-table td:nth-child(3) { width: 15%; }
  .stats-table th:nth-child(4), .stats-table td:nth-child(4) { width: 15%; }
  .stats-table th:nth-child(5), .stats-table td:nth-child(5) { width: 15%; }
  .stats-table th:nth-child(6), .stats-table td:nth-child(6) { width: 20%; min-width: 200px; }
  .stats-table .title-column {
    text-align: left;
    font-weight: 500;
    color: #007bff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stats-table .title-column a {
    text-decoration: none;
    color: #007bff;
  }
  .stats-table .title-column a:hover {
    text-decoration: underline;
    color: #0056b3;
  }
  .interaction-column {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .interaction-column .views {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #28a745;
    font-weight: 500;
  }
  .interaction-column .comments {
    display: flex;
    align-items: center;
    gap: 3px;
    color: #dc3545;
    font-weight: 500;
  }
  .interaction-column svg {
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

const ComprehensiveStatistics = () => {
  const [activeTab, setActiveTab] = useState('pageVisits');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const baseUrl = 'http://localhost:8000/article/api/v1/Statistic';
  const pageSize = 15;

  // State cho các tab
  const [tabStates, setTabStates] = useState({
    pageVisits: { currentPage: 1, totalPages: 1, timeFilter: 'daily', startDate: '2025-01-01', endDate: '2025-12-31' },
    viewReadingFreq: { currentPage: 1, totalPages: 1, startDate: '2025-01-01', endDate: '2025-12-31' },
    overallReadingFreq: { currentPage: 1, totalPages: 1, startDate: '2025-01-01', endDate: '2025-12-31' },
    articleStatistics: {
      viewStats: { currentPage: 1, totalPages: 1, startDate: '2025-01-01', endDate: '2025-12-31' },
      commentStats: { currentPage: 1, totalPages: 1, startDate: '2025-01-01', endDate: '2025-12-31' },
    },
  });

  // Dữ liệu trạng thái
  const [pageViews, setPageViews] = useState({ daily: [], monthly: [], yearly: [] });
  const [userReadingFreq, setUserReadingFreq] = useState(null);
  const [allUsersReadingFreq, setAllUsersReadingFreq] = useState([]);
  const [articleViewStats, setArticleViewStats] = useState([]);
  const [articleCommentStats, setArticleCommentStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalReadingCount, setTotalReadingCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập dữ liệu.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };
      const { startDate, endDate, currentPage, timeFilter } = tabStates[activeTab] || tabStates.articleStatistics[activeTab];

      try {
        // Lấy danh sách người dùng
        const userListResponse = await axios.get('http://localhost:8000/auth/api/v1/User', { headers });
        const userData = userListResponse.data.data || [];
        setUsers(userData);

        // Lấy danh sách bài đăng
        const articleResponse = await axios.get('http://localhost:8000/article/api/v1/Article/filter?pageSize=10&pageNumber=1', { headers });
        const articleData = articleResponse.data.data?.items || [];
        setArticles(articleData);

        switch (activeTab) {
          case 'pageVisits':
            const pageVisitResponse = await axios.get(`${baseUrl}/page-visit-stats`, {
              headers,
              params: { startDate, endDate, pageNumber: currentPage, pageSize: 10 },
            });
            const pageVisitData = pageVisitResponse.data;
            const dailyData = Object.entries(pageVisitData.dailyStats || {})
              .map(([date, views]) => ({ date, views }))
              .sort((a, b) => new Date(a.date) - new Date(b.date));
            const monthlyData = Object.entries(pageVisitData.monthlyStats || {})
              .map(([month, views]) => ({ date: month, views }))
              .sort((a, b) => parseInt(a.date) - parseInt(b.date));
            const yearlyData = Object.entries(pageVisitData.yearlyStats || {})
              .map(([year, views]) => ({ date: year, views }))
              .sort((a, b) => parseInt(a.date) - parseInt(b.date));
            setPageViews({ daily: dailyData, monthly: monthlyData, yearly: yearlyData });
            setTabStates((prev) => ({
              ...prev,
              pageVisits: { ...prev.pageVisits, totalPages: pageVisitData.totalPages || 1 },
            }));
            break;

          case 'viewReadingFreq':
            const userId = '11111111-1111-1111-1111-111111111111';
            const userReadingResponse = await axios.get(`${baseUrl}/reading-freq-user-stats/${userId}`, { headers });
            setUserReadingFreq(userReadingResponse.data?.[0] || null);
            break;

          case 'overallReadingFreq':
            const allUsersReadingResponse = await axios.get(`${baseUrl}/reading-freq-all-user-stats`, { headers });
            const readingData = allUsersReadingResponse.data.items || [];
            setAllUsersReadingFreq(readingData);
            setTotalReadingCount(readingData.reduce((sum, item) => sum + (item.readingCount || 0), 0));
            setTabStates((prev) => ({
              ...prev,
              overallReadingFreq: { ...prev.overallReadingFreq, totalPages: allUsersReadingResponse.data.totalPages || 1 },
            }));
            break;

          case 'viewStats':
            const viewStatsResponse = await axios.get(`${baseUrl}/article-view-stats`, {
              headers,
              params: {
                publishStartDate: startDate,
                publishEndDate: endDate,
                viewStartDate: startDate,
                viewEndDate: endDate,
                pageNumber: currentPage,
                pageSize,
              },
            });
            const viewData = viewStatsResponse.data.data;
            setArticleViewStats(viewData.items || []);
            setTotalViews(viewData.items.reduce((sum, item) => sum + (item.views || 0), 0));
            setTabStates((prev) => ({
              ...prev,
              articleStatistics: {
                ...prev.articleStatistics,
                viewStats: { ...prev.articleStatistics.viewStats, totalPages: viewData.totalPages || 1 },
              },
            }));
            break;

          case 'commentStats':
            const sampleArticleId = 'cec1544a-26e9-4497-88c8-fb98142aae80'; // Ví dụ articleId, có thể thay bằng logic lấy articleId động
            const commentResponse = await axios.get(`http://localhost:8000/article/api/v1/Comment/article/${sampleArticleId}?pageNumber=${currentPage}&pageSize=${pageSize}`, { headers });
            const commentData = commentResponse.data.data;
            setArticleCommentStats(commentData.items || []);
            setTotalComments(commentData.totalCount || 0);
            setTotalArticles(new Set(commentData.items.map(c => c.articleId)).size);
            setTabStates((prev) => ({
              ...prev,
              articleStatistics: {
                ...prev.articleStatistics,
                commentStats: { ...prev.articleStatistics.commentStats, totalPages: commentData.totalPages || 1 },
              },
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
  }, [
    activeTab,
    tabStates[activeTab]?.currentPage,
    tabStates[activeTab]?.startDate,
    tabStates[activeTab]?.endDate,
    tabStates.articleStatistics[activeTab]?.currentPage,
    tabStates.articleStatistics[activeTab]?.startDate,
    tabStates.articleStatistics[activeTab]?.endDate,
  ]);

  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    if (['viewStats', 'commentStats'].includes(activeTab)) {
      setTabStates((prev) => ({
        ...prev,
        articleStatistics: { ...prev.articleStatistics, [activeTab]: { ...prev.articleStatistics[activeTab], currentPage: page } },
      }));
    } else {
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], currentPage: page },
      }));
    }
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (field, value) => {
    if (['viewStats', 'commentStats'].includes(activeTab)) {
      setTabStates((prev) => ({
        ...prev,
        articleStatistics: { ...prev.articleStatistics, [activeTab]: { ...prev.articleStatistics[activeTab], [field]: value, currentPage: 1 } },
      }));
    } else {
      setTabStates((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], [field]: value, currentPage: 1 },
      }));
    }
  };

  // Xử lý thay đổi bộ lọc thời gian
  const handleTimeFilterChange = (value) => {
    setTabStates((prev) => ({
      ...prev,
      pageVisits: { ...prev.pageVisits, timeFilter: value, currentPage: 1 },
    }));
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Ngày không hợp lệ' : date.toLocaleDateString('vi-VN');
  };

  // Lấy tên người dùng
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : userId || 'N/A';
  };

  // Dữ liệu biểu đồ
  const pageViewsData = pageViews[tabStates.pageVisits.timeFilter];
  const totalPageViews = pageViewsData.reduce((sum, item) => sum + item.views, 0);
  const chartData = {
    labels: pageViewsData.map((item) => item.date),
    datasets: [
      {
        label: 'Lượt truy cập',
        data: pageViewsData.map((item) => item.views),
        borderColor: '#007bff',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(0, 123, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(0, 123, 255, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#007bff',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#007bff',
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 14 }, color: '#333' } },
      title: {
        display: true,
        text: `Lượt truy cập trang web theo ${tabStates.pageVisits.timeFilter === 'daily' ? 'ngày' : tabStates.pageVisits.timeFilter === 'monthly' ? 'tháng' : 'năm'}`,
        font: { size: 18, weight: 'bold' },
        color: '#333',
        padding: { top: 10, bottom: 20 },
      },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { size: 14 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 5 },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Lượt truy cập', font: { size: 14, weight: 'bold' }, color: '#333' }, grid: { color: 'rgba(0, 0, 0, 0.05)' }, ticks: { color: '#555' } },
      x: { title: { display: true, text: 'Thời gian', font: { size: 14, weight: 'bold' }, color: '#333' }, grid: { display: false }, ticks: { color: '#555' } },
    },
  };

  // Tạo phân trang
  const renderPagination = () => {
    const { currentPage, totalPages } = ['viewStats', 'commentStats'].includes(activeTab)
      ? tabStates.articleStatistics[activeTab]
      : tabStates[activeTab];
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
          {number}
        </Pagination.Item>,
      );
    }
    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1} />
        {items}
        <Pagination.Next onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  // Render bảng dữ liệu
  const renderTable = () => {
    switch (activeTab) {
      case 'pageVisits':
        return pageViewsData.length > 0 ? (
          <>
            <div className="text-muted mb-3 text-center">
              Tổng lượt truy cập: <strong>{totalPageViews.toLocaleString()}</strong>
            </div>
            <Line data={chartData} options={chartOptions} />
          </>
        ) : (
          <Alert variant="info">Không có dữ liệu lượt truy cập trong khoảng thời gian này.</Alert>
        );

      case 'viewReadingFreq':
        return userReadingFreq ? (
          <div className="bg-light p-3 rounded">
            <p className="text-dark mb-0">
              <strong>Người dùng:</strong> {getUserName(userReadingFreq.userId)}
              <br />
              <strong>Ngày tạo:</strong> {formatDate(userReadingFreq.createAt)}
              <br />
              <strong>Lượt đọc:</strong> {userReadingFreq.readingCount || 'N/A'}
            </p>
          </div>
        ) : (
          <Alert variant="warning">Không tìm thấy dữ liệu tần suất đọc của người dùng.</Alert>
        );

      case 'overallReadingFreq':
        return allUsersReadingFreq.length > 0 ? (
          <Table striped bordered hover responsive className="stats-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Ngày tạo</th>
                <th>Lượt đọc</th>
              </tr>
            </thead>
            <tbody>
              {allUsersReadingFreq.map((item) => (
                <tr key={item.id}>
                  <td>{getUserName(item.userId)}</td>
                  <td>{formatDate(item.createAt)}</td>
                  <td>{item.readingCount || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Alert variant="info">Không có dữ liệu tần suất đọc.</Alert>
        );

      case 'viewStats':
        return articleViewStats.length > 0 ? (
          <Table striped bordered hover responsive className="stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tiêu đề</th>
                <th>Chủ đề</th>
                <th>Tác giả</th>
                <th>Ngày xuất bản</th>
                <th>Lượt xem</th>
              </tr>
            </thead>
            <tbody>
              {articleViewStats.map((article, index) => (
                <tr key={article.id}>
                  <td>{(tabStates.articleStatistics.viewStats.currentPage - 1) * pageSize + index + 1}</td>
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
        ) : (
          <Alert variant=""></Alert>
        );

      case 'commentStats':
        return articleCommentStats.length > 0 || totalComments > 0 ? (
          <div>
            <p className="text-center">
              <strong>Tổng số bình luận:</strong> {totalComments}
            </p>
          </div>
        ) : (
          <Alert variant="info">Không có dữ liệu bình luận trong khoảng thời gian này.</Alert>
        );

      default:
        return null;
    }
  };

  // Render overview
  const renderOverview = () => {
    switch (activeTab) {
      case 'pageVisits':
        return (
          <Row className="mb-4">
            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div>
                    <Card.Title>Tổng lượt truy cập</Card.Title>
                    <Card.Text>{totalPageViews}</Card.Text>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
      case 'viewStats':
        return (
          <Row className="mb-4">
            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div>
                    <Card.Title>Tổng lượt xem</Card.Title>
                    <Card.Text>{totalReadingCount}</Card.Text>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        );
      case 'commentStats':
        return (
          <Row className="mb-4">
            <Col md={4}>
              <Card className="overview-card">
                <Card.Body>
                  <div>
                    <Card.Title>Tổng số bình luận</Card.Title>
                    <Card.Text>{totalComments}</Card.Text>
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
          Thống kê tổng hợp
        </h2>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          <Nav variant="tabs">
            <Nav.Item>
              <Nav.Link eventKey="pageVisits">Lượt truy cập trang</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="viewReadingFreq">Xem tần suất đọc báo</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="overallReadingFreq">Tần suất đọc tổng thể</Nav.Link>
            </Nav.Item>
            <NavDropdown title="Thống kê bài viết" id="article-stats-dropdown">
              <NavDropdown.Item eventKey="viewStats">Thống kê lượt xem</NavDropdown.Item>
              <NavDropdown.Item eventKey="commentStats">Thống kê bình luận</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Tab.Content>
            <div className="date-filter-form">
              <Form.Group controlId="startDate">
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={
                    ['viewStats', 'commentStats'].includes(activeTab)
                      ? tabStates.articleStatistics[activeTab].startDate
                      : tabStates[activeTab].startDate
                  }
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="endDate">
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={
                    ['viewStats', 'commentStats'].includes(activeTab)
                      ? tabStates.articleStatistics[activeTab].endDate
                      : tabStates[activeTab].endDate
                  }
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                />
              </Form.Group>
              {activeTab === 'pageVisits' && (
                <Form.Group>
                  <Form.Label>Chọn khoảng thời gian</Form.Label>
                  <Form.Select value={tabStates.pageVisits.timeFilter} onChange={(e) => handleTimeFilterChange(e.target.value)}>
                    <option value="daily">Theo ngày</option>
                    <option value="monthly">Theo tháng</option>
                    <option value="yearly">Theo năm</option>
                  </Form.Select>
                </Form.Group>
              )}
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            {loading ? (
              <div className="text-center">Đang tải dữ liệu...</div>
            ) : (
              <>
                {renderOverview()}
                {renderTable()}
                {(['viewStats', 'commentStats'].includes(activeTab)
                  ? tabStates.articleStatistics[activeTab].totalPages > 1
                  : tabStates[activeTab].totalPages > 1) && renderPagination()}
              </>
            )}
          </Tab.Content>
        </Tab.Container>
      </Container>
      <Footer />
    </div>
  );
};

export default ComprehensiveStatistics;