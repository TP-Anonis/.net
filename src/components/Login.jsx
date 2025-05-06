import React, { useState, useContext } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Image, InputGroup } from 'react-bootstrap';
import Register from './Register';
import { AuthContext } from '../context/AuthContext';
import { loginUser, requestResetPassword, resetPassword } from '../services/authApi';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import '../assets/css/Login.css';

const Login = ({ show = false, handleClose }) => {
  const { login } = useContext(AuthContext);
  const [showRegister, setShowRegister] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetData, setResetData] = useState({ otp: '', newPassword: '' });
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    try {
      const response = await loginUser(formData.email, formData.password);
      const { token } = response;

      const decodedToken = jwtDecode(token);
      console.log('Decoded Token:', decodedToken);
      const email = decodedToken.unique_name || formData.email;
      const role = decodedToken.role || decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      let correctUserAccountId = null;

      // Lấy userId từ token (token trả về userId thay vì userAccountId)
      if (decodedToken.userId) {
        correctUserAccountId = decodedToken.userId;
        console.log('Lấy userAccountId từ token (userId):', correctUserAccountId);
      } else {
        // Gọi API để lấy userAccountId nếu token không có userId
        try {
          const profileResponse = await axios.get(
            `http://localhost:8000/auth/api/v1/User/Get-details-by-account-id?email=${email}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log('Profile Response:', profileResponse.data);
          if (profileResponse.data && profileResponse.data.userAccountId) {
            correctUserAccountId = profileResponse.data.userAccountId;
          } else {
            throw new Error('Phản hồi API profile không chứa userAccountId');
          }
        } catch (profileError) {
          console.error('Lỗi khi lấy profile:', profileError);
          setError('Không thể lấy userAccountId. Vui lòng thử lại sau.');
          return;
        }
      }

      const userData = {
        id: correctUserAccountId,
        username: email,
        roleId: role === 'Admin' ? 3 : role === 'Editor' ? 2 : 1,
        createdAt: new Date(decodedToken.iat * 1000).toISOString(),
        status: 'active',
      };

      console.log('UserData trước khi lưu:', userData);
      localStorage.setItem('token', token);
      localStorage.setItem('userAccountId', correctUserAccountId);
      console.log('userAccountId lưu vào localStorage:', localStorage.getItem('userAccountId'));
      login(userData);
      setError('');
      alert('Đăng nhập thành công!');
      handleClose();
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không đúng!');
      console.error('Lỗi đăng nhập:', err);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');

    try {
      if (resetStep === 1) {
        await requestResetPassword(resetEmail);
        setResetStep(2);
        setResetError('Mã OTP đã được gửi. Vui lòng kiểm tra email.');
      } else {
        await resetPassword(resetEmail, resetData.newPassword, resetData.otp);
        alert('Đổi mật khẩu thành công!');
        setShowResetPassword(false);
        setResetStep(1);
      }
    } catch (err) {
      setResetError(err.message || 'Đổi mật khẩu thất bại! Vui lòng kiểm tra lại OTP hoặc mật khẩu.');
    }
  };

  return (
    <>
      <Modal
        show={Boolean(show) && !showRegister && !showResetPassword}
        onHide={handleClose}
        centered
        dialogClassName="login-modal"
        size="xl"
      >
        <Modal.Body className="p-0">
          <Row className="m-0">
            <Col md={5} className="d-none d-md-block login-left-section">
              <div className="d-flex justify-content-center align-items-center h-100">
                <Image
                  src="../src/assets/img/logo.png"
                  alt="Logo"
                  className="login-logo"
                  fluid
                />
              </div>
            </Col>
            <Col md={7} className="login-right-section p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="modal-title">Đăng nhập</h3>
                <Button variant="link" className="p-0" onClick={handleClose}>
                  <i className="bi bi-x-lg"></i>
                </Button>
              </div>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4" controlId="formEmail">
                  <Form.Label className="form-label">Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-envelope"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                      required
                      className="form-control-custom rounded-end"
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-4" controlId="formPassword">
                  <Form.Label className="form-label">Mật khẩu</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <i className="bi bi-lock"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      required
                      className="form-control-custom rounded-end"
                    />
                  </InputGroup>
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-custom rounded-pill mb-4"
                >
                  Đăng nhập
                </Button>
              </Form>
              <div className="text-center">
                <p className="mb-0 link-text">
                  Quên mật khẩu?{' '}
                  <Button
                    variant="link"
                    className="p-0 text-primary link-text"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Đặt lại mật khẩu
                  </Button>
                </p>
                <p className="mb-0 link-text">
                  Chưa có tài khoản?{' '}
                  <Button
                    variant="link"
                    className="p-0 text-primary link-text"
                    onClick={() => setShowRegister(true)}
                  >
                    Đăng ký ngay
                  </Button>
                </p>
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      <Modal
        show={showResetPassword}
        onHide={() => {
          setShowResetPassword(false);
          setResetStep(1);
        }}
        centered
        dialogClassName="login-modal"
        size="xl"
      >
        <Modal.Body className="p-0">
          <Row className="m-0">
            <Col md={5} className="d-none d-md-block login-left-section">
              <div className="d-flex justify-content-center align-items-center h-100">
                <Image
                  src="../src/assets/img/logo.png"
                  alt="Logo"
                  className="login-logo"
                  fluid
                />
              </div>
            </Col>
            <Col md={7} className="login-right-section p-5">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="modal-title">
                  {resetStep === 1 ? 'Đặt lại mật khẩu' : 'Xác nhận OTP'}
                </h3>
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetStep(1);
                  }}
                >
                  <i className="bi bi-x-lg"></i>
                </Button>
              </div>
              {resetError && <Alert variant="danger">{resetError}</Alert>}
              <Form onSubmit={handleResetPasswordSubmit}>
                {resetStep === 1 ? (
                  <Form.Group className="mb-4" controlId="formResetEmail">
                    <Form.Label className="form-label">Email</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-envelope"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Nhập email"
                        required
                        className="form-control-custom rounded-end"
                      />
                    </InputGroup>
                  </Form.Group>
                ) : (
                  <>
                    <Form.Group className="mb-4" controlId="formResetOTP">
                      <Form.Label className="form-label">Mã OTP</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-shield-lock"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="otp"
                          value={resetData.otp}
                          onChange={handleResetChange}
                          placeholder="Nhập mã OTP"
                          required
                          className="form-control-custom rounded-end"
                        />
                      </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-4" controlId="formResetNewPassword">
                      <Form.Label className="form-label">Mật khẩu mới</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-lock"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="password"
                          name="newPassword"
                          value={resetData.newPassword}
                          onChange={handleResetChange}
                          placeholder="Nhập mật khẩu mới"
                          required
                          className="form-control-custom rounded-end"
                        />
                      </InputGroup>
                    </Form.Group>
                  </>
                )}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-custom rounded-pill mb-4"
                >
                  {resetStep === 1 ? 'Gửi OTP' : 'Đổi mật khẩu'}
                </Button>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      <Register
        show={showRegister}
        handleClose={() => {
          setShowRegister(false);
          handleClose();
        }}
        handleBack={() => setShowRegister(false)}
      />
    </>
  );
};

export default Login;