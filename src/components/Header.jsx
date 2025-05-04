import React, { useState, useContext, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Form, InputGroup, Dropdown, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaFileAlt, FaPen, FaUsers, FaFolderOpen, FaChartBar, FaNewspaper, FaImage, FaSignOutAlt, FaBookmark, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import '../assets/css/HomePage.css';

const API_URL_TOPIC_FILTER = 'http://localhost:5288/api/v1/Topic/filter';

// Biến toàn cục để làm mới danh sách chủ đề
let refreshTopicsCallback = null;

const Header = () => {
  const { isLoggedIn, user, logout } = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [topics, setTopics] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  // Hàm định dạng ngày và thứ
  const formatDate = () => {
    const date = new Date();
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];
    return `${weekday}, ${day}/${month}/${year}`;
  };

  // Cập nhật ngày khi component mount
  useEffect(() => {
    setCurrentDate(formatDate());
  }, []);

  // Lấy danh sách chủ đề từ API
  const fetchTopics = async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      console.error('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      const response = await axios.get(API_URL_TOPIC_FILTER, {
        params: {
          sortByNameAsc: false,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Topic filter response:', response.data);

      const topicData = response.data?.data?.items || [];
      // Lọc bỏ các chủ đề "Tâm lý", "Pháp luật", "Chính trị"
      const filteredTopics = topicData.filter(
        (topic) =>
          !['tâm lý', 'pháp luật', 'chính trị'].includes(topic.name.toLowerCase())
      );
      setTopics(filteredTopics);
    } catch (error) {
      console.error('Error fetching topics:', error.response?.data || error.message);
    }
  };

  // Lấy danh sách chủ đề khi component mount hoặc khi refreshTrigger thay đổi
  useEffect(() => {
    fetchTopics();
  }, [refreshTrigger]);

  // Hàm làm mới danh sách chủ đề
  const refreshTopics = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Gán hàm refreshTopics vào biến toàn cục để có thể gọi từ bên ngoài
  useEffect(() => {
    refreshTopicsCallback = refreshTopics;
    return () => {
      refreshTopicsCallback = null;
    };
  }, []);

  const handleShowLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);

  const handleLogout = () => {
    logout();
    alert('Đăng xuất thành công!');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategorySelect = (category) => {
    navigate(`/search?category=${encodeURIComponent(category)}`);
  };

  // Ánh xạ tên chủ đề với route để khớp với App.jsx
  const routeMapping = {
    'thể thao': 'the-thao',
    'thế giới': 'the-gioi',
    'sức khỏe': 'suc-khoe',
    'kinh doanh': 'kinh-doanh',
    'giải trí': 'giai-tri',
  };

  // Lấy 7 chủ đề đầu tiên
  const visibleTopics = topics
    .map((topic) => {
      const formattedName = topic.name.toLowerCase().replace(/\s+/g, '-');
      const route = routeMapping[topic.name.toLowerCase()] || formattedName;
      return { ...topic, route };
    })
    .slice(0, 7);

  // Lấy các chủ đề còn lại (từ chủ đề thứ 8 trở đi)
  const remainingTopics = topics
    .map((topic) => {
      const formattedName = topic.name.toLowerCase().replace(/\s+/g, '-');
      const route = routeMapping[topic.name.toLowerCase()] || formattedName;
      return { ...topic, route };
    })
    .filter((topic) => !visibleTopics.some((visibleTopic) => visibleTopic.id === topic.id));

  // Debug: Kiểm tra danh sách topics
  console.log('All topics:', topics);
  console.log('Visible topics:', visibleTopics);
  console.log('Remaining topics:', remainingTopics);

  return (
    <div className="header-wrapper">
      <div className="top-bar bg-dark text-white d-flex justify-content-between align-items-center p-2">
        <span className="text-light">{currentDate}</span>
        <div className="top-links d-flex align-items-center">
          {isLoggedIn ? (
            <Dropdown>
              <Dropdown.Toggle variant="link" id="dropdown-user" className="text-white text-decoration-none">
                <img
                  src={user?.avatar || 'https://placehold.co/30x30?text=User'}
                  alt="Avatar"
                  className="rounded-circle me-1"
                  style={{ width: '30px', height: '30px' }}
                />
                <span>{user?.username}</span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> Thông tin người dùng
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/post-management">
                  <FaFileAlt className="me-2" /> Quản Lý Bài Viết
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/write-post">
                  <FaPen className="me-2" /> Viết Bài Mới
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/account-management">
                  <FaUsers className="me-2" /> Quản lý thông tin độc giả
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/content-management">
                  <FaFolderOpen className="me-2" /> Quản lý nội dung
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/overview-stats">
                  <FaChartBar className="me-2" /> Xem thống kê tổng quan
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/article-stats">
                  <FaNewspaper className="me-2" /> Xem thống kê bài báo
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/saved-articles">
                  <FaBookmark className="me-2" /> Bài viết đã lưu
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Đăng xuất
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <Button variant="link" className="text-white text-decoration-none ms-2" onClick={handleShowLogin}>
              <i className="bi bi-person-circle me-1"></i> Đăng nhập
            </Button>
          )}
        </div>
      </div>
      <Navbar bg="light" variant="light" expand="lg" className="py-3 shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <img src="../src/assets/img/logo.png" alt="Logo Tin Tức" className="site-logo" />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {visibleTopics.map((topic) => (
                <Nav.Link
                  key={topic.id}
                  as={Link}
                  to={`/${topic.route}`}
                  className="nav-link-custom"
                >
                  {topic.name}
                </Nav.Link>
              ))}
              {remainingTopics.length > 0 && (
                <NavDropdown title="Chủ đề khác" id="remaining-topics-dropdown" className="nav-link-custom">
                  {remainingTopics.map((topic) => (
                    <NavDropdown.Item
                      key={topic.id}
                      as={Link}
                      to={`/${topic.route}`}
                    >
                      {topic.name}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>
            <div className="d-flex align-items-center">
              <Form onSubmit={handleSearch} className="me-3">
                <InputGroup className="search-bar">
                  <Form.Control
                    type="text"
                    placeholder="Tìm kiếm tin tức..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Tìm kiếm"
                    className="rounded-start"
                  />
                  <Button type="submit" variant="primary" className="search-icon rounded-end">
                    <i className="bi bi-search"></i>
                  </Button>
                </InputGroup>
              </Form>
              <Dropdown onSelect={handleCategorySelect}>
                <Dropdown.Toggle variant="outline-primary" id="dropdown-category">
                  Chọn chủ đề
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {topics.map((topic) => (
                    <Dropdown.Item key={topic.id} eventKey={topic.name}>
                      {topic.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Login show={showLogin} handleClose={handleCloseLogin} />
    </div>
  );
};

export const refreshTopics = () => {
  if (refreshTopicsCallback) {
    refreshTopicsCallback();
  }
};

export default Header;