/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { requestResetPassword, resetPassword } from '../services/authApi';
import { jwtDecode } from 'jwt-decode';
import '../assets/css/UserProfile.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL_GET_DETAILS = 'http://localhost:8000/auth/api/v1/User/Get-details-by-account-id';

const UserProfile = () => {
  const navigate = useNavigate();

  // Khởi tạo state
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    sex: '',
    birthday: '',
  });
  const [passwordData, setPasswordData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);

  // Lấy token và userAccountId từ localStorage
  const token = localStorage.getItem('token') || '';
  const userAccountId = localStorage.getItem('userAccountId') || '';

  // Kiểm tra token và userAccountId
  const checkTokenAndId = () => {
    if (!token) {
      setError('Token xác thực không tồn tại. Vui lòng đăng nhập lại.');
      console.log('Token không tồn tại trong localStorage.');
      return false;
    }
    if (!userAccountId) {
      setError('Không tìm thấy userAccountId. Vui lòng đăng nhập lại.');
      console.log('userAccountId không tồn tại trong localStorage.');
      return false;
    }
    console.log('Token được sử dụng:', token);
    console.log('userAccountId được sử dụng:', userAccountId);
    return true;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!checkTokenAndId()) return;

      setLoading(true);
      try {
        // Gọi API Get-details-by-account-id với userAccountId từ localStorage
        const detailsResponse = await axios.get(`${API_URL_GET_DETAILS}?id=${userAccountId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Phản hồi thông tin chi tiết:', detailsResponse.data);

        const userData = detailsResponse.data || {};
        if (!userData.userAccountId) {
          throw new Error('Phản hồi API không chứa thông tin người dùng hợp lệ.');
        }

        // Lấy email từ token để đảm bảo tính bảo mật
        const decoded = jwtDecode(token);
        const email = decoded.unique_name || decoded.email || '';

        // Cập nhật dữ liệu người dùng
        const finalUserData = {
          ...userData,
          email: email || userData.email || '',
        };

        setUser(finalUserData);
        setFormData({
          fullName: userData.fullName || '',
          email: email || userData.email || '',
          sex: userData.sex || '',
          birthday: userData.birthday ? userData.birthday.split('T')[0] : '',
        });
        setPasswordData((prev) => ({ ...prev, email: email || userData.email || '' }));
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định';
        setError('Lấy thông tin người dùng thất bại: ' + errorMessage);
        console.error('Lỗi khi lấy thông tin người dùng:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Xử lý thay đổi form thông tin
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi form mật khẩu
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý submit form thông tin
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName) {
      setError('Họ và tên không được để trống!');
    } else {
      setError('');
      console.log('Thông tin đã cập nhật:', formData);
      setIsEditing(false);
      setShowSuccessModal(true);
    }
  };

  // Xử lý chỉnh sửa
  const handleEditClick = (e) => {
    e.preventDefault();
    setIsEditing(true);
  };

  // Đóng modal thành công
  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };

  // Hiển thị modal đổi mật khẩu
  const handleShowPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordStep(1);
  };

  // Đóng modal đổi mật khẩu
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordData((prev) => ({ ...prev, otp: '', newPassword: '', confirmPassword: '' }));
    setPasswordError('');
    setPasswordStep(1);
  };

  // Xử lý submit đổi mật khẩu
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    try {
      if (passwordStep === 1) {
        if (!passwordData.email) {
          setPasswordError('Vui lòng nhập email!');
          return;
        }
        await requestResetPassword(passwordData.email);
        setPasswordStep(2);
        setPasswordError('Mã OTP đã được gửi. Vui lòng kiểm tra email.');
      } else {
        if (!passwordData.otp) {
          setPasswordError('Vui lòng nhập mã OTP!');
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp!');
          return;
        }
        if (passwordData.newPassword.length < 6) {
          setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
          return;
        }

        await resetPassword(passwordData.email, passwordData.newPassword, passwordData.otp);
        alert('Đổi mật khẩu thành công!');
        handleClosePasswordModal();
        setShowSuccessModal(true);
      }
    } catch (err) {
      setPasswordError(err.message || 'Thao tác thất bại! Vui lòng kiểm tra lại thông tin.');
    }
  };

  // Hiển thị khi đang tải
  if (loading) {
    return (
      <>
        <Header />
        <Container className="user-profile-container py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <div className="text-center">Đang tải thông tin người dùng...</div>
            </Col>
          </Row>
        </Container>
        <Footer />
      </>
    );
  }

  // Hiển thị khi không có dữ liệu
  if (!user) {
    return (
      <>
        <Header />
        <Container className="user-profile-container py-5">
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Alert variant="danger">{error || 'Không thể tải thông tin người dùng.'}</Alert>
            </Col>
          </Row>
        </Container>
        <Footer />
      </>
    );
  }

  // Giao diện chính
  return (
    <>
      <Header />
      <Container className="user-profile-container py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-sm">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h3 className="modal-title">{formData.fullName}</h3>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4" controlId="formFullName">
                    <Form.Label className="form-label">Họ và tên</Form.Label>
                    <Form.Control
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên"
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formEmail">
                    <Form.Label className="form-label">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      disabled
                      className="form-control-custom rounded-pill"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formSex">
                    <Form.Label className="form-label">Giới tính</Form.Label>
                    <Form.Select
                      name="sex"
                      value={formData.sex}
                      onChange={handleChange}
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formBirthday">
                    <Form.Label className="form-label">Ngày sinh</Form.Label>
                    <Form.Control
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="form-control-custom rounded-pill"
                      disabled={!isEditing}
                    />
                  </Form.Group>

                  {isEditing ? (
                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 btn-custom rounded-pill"
                    >
                      Lưu
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={handleEditClick}
                      className="w-100 btn-custom rounded-pill"
                    >
                      Chỉnh sửa
                    </Button>
                  )}
                </Form>

                {/* Nút Đổi mật khẩu */}
                {!isEditing && (
                  <Button
                    variant="outline-primary"
                    className="w-100 btn-custom rounded-pill mt-3"
                    onClick={handleShowPasswordModal}
                  >
                    Đổi mật khẩu
                  </Button>
                )}

                {/* Modal xác nhận lưu thành công */}
                <Modal show={showSuccessModal} onHide={handleCloseModal} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>Thông báo</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-center">Bạn đã lưu thông tin thành công!</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="primary" onClick={handleCloseModal}>
                      Đóng
                    </Button>
                  </Modal.Footer>
                </Modal>

                {/* Modal đổi mật khẩu */}
                <Modal show={showPasswordModal} onHide={handleClosePasswordModal} centered>
                  <Modal.Header closeButton>
                    <Modal.Title>{passwordStep === 1 ? 'Đặt lại mật khẩu' : 'Xác nhận OTP'}</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                    <Form onSubmit={handlePasswordSubmit}>
                      {passwordStep === 1 ? (
                        <Form.Group className="mb-4" controlId="formResetEmail">
                          <Form.Label className="form-label">Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={passwordData.email}
                            onChange={handlePasswordChange}
                            placeholder="Nhập email"
                            className="form-control-custom rounded-pill"
                            disabled
                          />
                        </Form.Group>
                      ) : (
                        <>
                          <Form.Group className="mb-4" controlId="formResetOTP">
                            <Form.Label className="form-label">Mã OTP</Form.Label>
                            <Form.Control
                              type="text"
                              name="otp"
                              value={passwordData.otp}
                              onChange={handlePasswordChange}
                              placeholder="Nhập mã OTP"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-4" controlId="formResetNewPassword">
                            <Form.Label className="form-label">Mật khẩu mới</Form.Label>
                            <Form.Control
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Nhập mật khẩu mới"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                          <Form.Group className="mb-4" controlId="formResetConfirmPassword">
                            <Form.Label className="form-label">Xác nhận mật khẩu mới</Form.Label>
                            <Form.Control
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Xác nhận mật khẩu mới"
                              className="form-control-custom rounded-pill"
                              required
                            />
                          </Form.Group>
                        </>
                      )}
                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 btn-custom rounded-pill"
                      >
                        {passwordStep === 1 ? 'Gửi OTP' : 'Đổi mật khẩu'}
                      </Button>
                    </Form>
                  </Modal.Body>
                </Modal>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default UserProfile;