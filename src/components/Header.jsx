import React, { useState, useContext, useEffect } from 'react';
import { Navbar, Nav, Button, Container, Dropdown, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Login from './Login';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaFileAlt, FaPen, FaUsers, FaFolderOpen, FaChartBar, FaNewspaper, FaBookmark, FaSignOutAlt, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import '../assets/css/HomePage.css';

const API_URL_TOPIC_FILTER = 'http://localhost:8000/article/api/v1/Topic/filter?pageNumber=1&pageSize=10&sortByNameAsc=false';
const API_URL_CATEGORY_FILTER = 'http://localhost:8000/article/api/v1/Category/filter?pageNumber=1&pageSize=10';

let refreshDataCallback = null;

const Header = () => {
  const { isLoggedIn, user, logout } = useContext(AuthContext);
  const [showLogin, setShowLogin] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const formatDate = () => {
    const date = new Date();
    const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];
    return `${weekday}, ${day}/${month}/${year}`;
  };

  useEffect(() => {
    setCurrentDate(formatDate());
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_TOPIC_FILTER, config);
      const topicData = response.data?.data?.items || [];
      console.log('Danh sách chủ đề từ API:', topicData); // Log để kiểm tra dữ liệu
      // Chỉ lọc tâm lý và chính trị, giữ lại pháp luật
      const filteredTopics = topicData.filter(
        (topic) => !['tâm lý', 'chính trị'].includes(topic.name.toLowerCase())
      );
      console.log('Danh sách chủ đề sau khi lọc:', filteredTopics); // Log để kiểm tra sau lọc
      setTopics(filteredTopics);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chủ đề:', error.response?.data || error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(API_URL_CATEGORY_FILTER, config);
      const categoryData = response.data?.data?.items || [];
      setCategories(categoryData);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchCategories();
  }, [refreshTrigger]);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    refreshDataCallback = refreshData;
    return () => {
      refreshDataCallback = null;
    };
  }, []);

  const handleShowLogin = () => setShowLogin(true);
  const handleCloseLogin = () => setShowLogin(false);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userAccountId');
    alert('Đăng xuất thành công!');
    navigate('/');
  };

  const routeMapping = {
    'thể thao': 'the-thao',
    'thế giới': 'the-gioi',
    'sức khỏe': 'suc-khoe',
    'kinh doanh': 'kinh-doanh',
    'giải trí': 'giai-tri',
    'pháp luật': 'phap-luat',
    'bất động sản': 'bat-dong-san', // Thêm định dạng cho Bất động sản
  };

  const visibleTopics = topics
    .map((topic) => {
      const formattedName = topic.name.toLowerCase().replace(/\s+/g, '-');
      const route = routeMapping[topic.name.toLowerCase()] || formattedName;
      console.log(`Topic: ${topic.name}, Route: ${route}`); // Log để kiểm tra route
      return { ...topic, route };
    })
    .slice(0, 7);

  const remainingTopics = topics
    .map((topic) => {
      const formattedName = topic.name.toLowerCase().replace(/\s+/g, '-');
      const route = routeMapping[topic.name.toLowerCase()] || formattedName;
      return { ...topic, route };
    })
    .filter((topic) => !visibleTopics.some((visibleTopic) => visibleTopic.id === topic.id));

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
                {user?.roleId === 1 && (
                  <Dropdown.Item as={Link} to="/saved-articles">
                    <FaBookmark className="me-2" /> Bài viết đã lưu
                  </Dropdown.Item>
                )}
                {(user?.roleId === 2 || user?.roleId === 3) && (
                  <>
                    <Dropdown.Item as={Link} to="/write-post">
                      <FaPen className="me-2" /> Viết Bài Mới
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/post-history">
                      <FaHistory className="me-2" /> Quản lý tin đăng
                    </Dropdown.Item>
                  </>
                )}
                {user?.roleId === 3 && (
                  <>
                    <Dropdown.Item as={Link} to="/post-management">
                      <FaFileAlt className="me-2" /> Quản Lý Bài Viết
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/account-management">
                      <FaUsers className="me-2" /> Quản lý thông tin độc giả
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/content-management">
                      <FaFolderOpen className="me-2" /> Quản lý nội dung
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/comprehensive-stats">
                      <FaChartBar className="me-2" /> Xem thống kê tổng hợp
                    </Dropdown.Item>
                  </>
                )}
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
                <Nav.Link key={topic.id} as={Link} to={`/${topic.route}`} className="nav-link-custom">
                  {topic.name}
                </Nav.Link>
              ))}
              {remainingTopics.length > 0 && (
                <NavDropdown title="Chủ đề khác" id="remaining-topics-dropdown" className="nav-link-custom">
                  {remainingTopics.map((topic) => (
                    <NavDropdown.Item key={topic.id} as={Link} to={`/${topic.route}`}>
                      {topic.name}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Login show={showLogin} handleClose={handleCloseLogin} />
    </div>
  );
};

export const refreshData = () => {
  if (refreshDataCallback) {
    refreshDataCallback();
  }
};

export default Header;