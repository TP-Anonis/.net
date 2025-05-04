import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Nav, Tab, Alert, Table, Form } from 'react-bootstrap';
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
import Header from './Header';
import Footer from './Footer';

// Đăng ký Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const OverviewStats = () => {
  const [timeFilter, setTimeFilter] = useState('daily');
  const [pageViews, setPageViews] = useState({ daily: [], monthly: [], yearly: [] });
  const [userReadingFreq, setUserReadingFreq] = useState(null);
  const [allUsersReadingFreq, setAllUsersReadingFreq] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const baseUrl = 'http://localhost:8000/article/api/v1/Statistic';

  // Lấy dữ liệu từ API
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

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      try {
        // Lấy dữ liệu lượt truy cập
        const pageVisitResponse = await axios.get(`${baseUrl}/page-visit-stats`, {
          headers,
          params: {
            startDate: '2025-03-06T05:43:39.187Z',
            endDate: '2025-04-20T05:43:39.187Z',
            pageNumber: 1,
            pageSize: 10,
          },
        });

        if (!pageVisitResponse.data) {
          throw new Error('Dữ liệu không hợp lệ từ /page-visit-stats');
        }
        const pageVisitData = pageVisitResponse.data;

        const dailyData = Object.entries(pageVisitData.dailyStats || {})
          .map(([date, views]) => ({ date, views }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        const monthlyData = Object.entries(pageVisitData.monthlyStats || {})
          .map(([month, views]) => ({ date: `Tháng ${month}`, views }))
          .sort((a, b) => parseInt(a.date.split(' ')[1]) - parseInt(b.date.split(' ')[1]));
        const yearlyData = Object.entries(pageVisitData.yearlyStats || {})
          .map(([year, views]) => ({ date: year, views }))
          .sort((a, b) => parseInt(a.date) - parseInt(b.date));

        setPageViews({ daily: dailyData, monthly: monthlyData, yearly: yearlyData });

        // Lấy tần suất đọc của người dùng
        const userId = '11111111-1111-1111-1111-111111111111'; // ID của admin@gmail.com
        const userReadingResponse = await axios.get(
          `${baseUrl}/reading-freq-user-stats/${userId}`,
          { headers }
        );
        console.log('User Reading Freq Response:', userReadingResponse.data);
        // Xử lý dữ liệu: Lấy phần tử đầu tiên nếu là mảng, hoặc sử dụng trực tiếp nếu là đối tượng
        const userReadingData = Array.isArray(userReadingResponse.data)
          ? userReadingResponse.data[0] || null
          : userReadingResponse.data || null;
        setUserReadingFreq(userReadingData);
        console.log('Set userReadingFreq:', userReadingData);

        // Lấy tần suất đọc của tất cả người dùng
        const allUsersReadingResponse = await axios.get(`${baseUrl}/reading-freq-all-user-stats`, {
          headers,
        });
        console.log('All Users Reading Freq Response:', allUsersReadingResponse.data);
        setAllUsersReadingFreq(allUsersReadingResponse.data.items || []);

        // Lấy danh sách người dùng
        const userListResponse = await axios.get(`http://localhost:8000/auth/api/v1/User`, {
          headers,
        });
        console.log('User List Response:', userListResponse.data);
        setUsers(userListResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching data:', error.response || error);
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập hết hạn hoặc không có quyền truy cập. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 415) {
          setError('Lỗi 415: Server yêu cầu Content-Type hoặc Accept không đúng. Vui lòng kiểm tra cấu hình API.');
        } else if (error.response?.status === 404) {
          setError('API không tìm thấy hoặc dữ liệu không tồn tại.');
        } else {
          setError(`Lỗi khi lấy dữ liệu: ${error.response?.data?.message || error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dữ liệu biểu đồ lượt truy cập
  const pageViewsData = pageViews[timeFilter];
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
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 14 }, color: '#333' },
      },
      title: {
        display: true,
        text: `Lượt truy cập trang web theo ${timeFilter === 'daily' ? 'ngày' : timeFilter === 'monthly' ? 'tháng' : 'năm'}`,
        font: { size: 18, weight: 'bold' },
        color: '#333',
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 5,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Lượt truy cập', font: { size: 14, weight: 'bold' }, color: '#333' },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: '#555' },
      },
      x: {
        title: { display: true, text: 'Thời gian', font: { size: 14, weight: 'bold' }, color: '#333' },
        grid: { display: false },
        ticks: { color: '#555' },
      },
    },
  };

  // Hàm định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Ngày không hợp lệ' : date.toLocaleDateString('vi-VN');
  };

  // Hàm ánh xạ userId thành tên người dùng
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.email : userId || 'N/A';
  };

  // Log để debug giá trị userReadingFreq trước khi render
  console.log('Rendering userReadingFreq:', userReadingFreq);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <Container className="my-4">
        <h2 className="mb-4 text-center text-primary">Thống kê tổng quan</h2>

        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
          </div>
        )}

        {!loading && !error && (
          <Tab.Container defaultActiveKey="pageVisits">
            <Row>
              <Col>
                <Nav variant="tabs" className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="pageVisits">Lượt truy cập trang</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="userReadingFreq">Tần suất đọc của người dùng</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="allUsersReadingFreq">Tần suất đọc của tất cả người dùng</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  {/* Tab 1: Lượt truy cập trang */}
                  <Tab.Pane eventKey="pageVisits">
                    <Card className="mb-4 shadow-sm">
                      <Card.Header className="bg-light">
                        <Card.Title className="mb-0 text-dark">Thống kê lượt truy cập</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <Row className="align-items-center mb-3">
                          <Col md={6} className="mb-3 mb-md-0">
                            <Form.Group>
                              <Form.Label className="text-dark">Chọn khoảng thời gian</Form.Label>
                              <Form.Select
                                value={timeFilter}
                                onChange={(e) => setTimeFilter(e.target.value)}
                                className="form-control"
                              >
                                <option value="daily">Theo ngày</option>
                                <option value="monthly">Theo tháng</option>
                                <option value="yearly">Theo năm</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6} className="text-md-end">
                            <div className="text-muted">
                              Tổng lượt truy cập: <strong>{totalPageViews.toLocaleString()}</strong>
                            </div>
                          </Col>
                        </Row>
                        <Line data={chartData} options={chartOptions} />
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  {/* Tab 2: Tần suất đọc của người dùng */}
                  <Tab.Pane eventKey="userReadingFreq">
                    <Card className="mb-4 shadow-sm">
                      <Card.Header className="bg-light">
                        <Card.Title className="mb-0 text-dark">Tần suất đọc của người dùng</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        {userReadingFreq ? (
                          <div className="bg-light p-3 rounded">
                            <p className="text-dark mb-0">
                              <strong>ID:</strong> {userReadingFreq.id || 'N/A'}<br />
                              <strong>Người dùng:</strong> {getUserName(userReadingFreq.userId)}<br />
                              <strong>Ngày tạo:</strong> {formatDate(userReadingFreq.createAt) || 'N/A'}<br />
                              <strong>Lượt đọc:</strong> {userReadingFreq.readingCount || 'N/A'}
                            </p>
                          </div>
                        ) : (
                          <Alert variant="warning">Không tìm thấy dữ liệu tần suất đọc của người dùng.</Alert>
                        )}
                      </Card.Body>
                    </Card>
                  </Tab.Pane>

                  {/* Tab 3: Tần suất đọc của tất cả người dùng */}
                  <Tab.Pane eventKey="allUsersReadingFreq">
                    <Card className="shadow-sm">
                      <Card.Header className="bg-light">
                        <Card.Title className="mb-0 text-dark">Tần suất đọc của tất cả người dùng</Card.Title>
                      </Card.Header>
                      <Card.Body>
                        <Table striped bordered hover responsive>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Người dùng</th>
                              <th>Ngày tạo</th>
                              <th>Lượt đọc</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allUsersReadingFreq.length > 0 ? (
                              allUsersReadingFreq.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.id || 'N/A'}</td>
                                  <td>{getUserName(item.userId)}</td>
                                  <td>{formatDate(item.createAt) || 'N/A'}</td>
                                  <td>{item.readingCount || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center">
                                  Không có dữ liệu tần suất đọc.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default OverviewStats;