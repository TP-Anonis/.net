import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Image, InputGroup, Spinner } from 'react-bootstrap';
import { registerUser, sendVerificationEmail, verifyCode } from '../services/authApi';
import '../assets/css/Login.css';

const Register = ({ show = false, handleClose, handleBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    sex: 'Female',
    role: 'viewer',
    birthday: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự!';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.fullName ||
      !formData.birthday
    ) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);

      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        sex: formData.sex,
        role: formData.role,
        birthday: new Date(formData.birthday).toISOString(),
      };

      await registerUser(userData);
      await sendVerificationEmail(formData.email);
      setIsRegistered(true);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');

    try {
      setLoading(true);
      await verifyCode(formData.email, verifyCodeInput);
      alert('Xác thực email thành công! Bạn có thể đăng nhập.');
      handleClose();
    } catch (err) {
      setVerifyError(err.message || 'Mã xác thực không đúng. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={Boolean(show)} onHide={handleClose} centered dialogClassName="custom-wide-modal" size="xl">
      <Modal.Body className="p-0">
        <Row className="m-0">
          <Col md={4} className="d-none d-md-block login-left-section">
            <div className="d-flex justify-content-center align-items-center h-100">
              <Image src="../src/assets/img/logo.png" alt="Logo" className="login-logo" fluid />
            </div>
          </Col>

          <Col md={8} className="login-right-section p-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="modal-title">{isRegistered ? 'Xác thực email' : 'Đăng ký'}</h3>
              <Button variant="link" className="p-0" onClick={handleClose} disabled={loading}>
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {verifyError && <Alert variant="danger">{verifyError}</Alert>}

            {!isRegistered ? (
              <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                  <Col md={6}>
                    <Form.Group controlId="formRegisterEmail">
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
                          disabled={loading}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formRegisterFullName">
                      <Form.Label className="form-label">Họ và tên</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-person"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Nhập họ và tên"
                          required
                          className="form-control-custom rounded-end"
                          disabled={loading}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mt-3">
                  <Col md={6}>
                    <Form.Group controlId="formRegisterPassword">
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
                          disabled={loading}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formRegisterConfirmPassword">
                      <Form.Label className="form-label">Xác nhận mật khẩu</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <i className="bi bi-lock"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Xác nhận mật khẩu"
                          required
                          className="form-control-custom rounded-end"
                          disabled={loading}
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mt-3">
                  <Col md={6}>
                    <Form.Group controlId="formRegisterSex">
                      <Form.Label className="form-label">Giới tính</Form.Label>
                      <Form.Select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        className="form-control-custom"
                        disabled={loading}
                      >
                        <option value="Female">Nữ</option>
                        <option value="Male">Nam</option>
                        <option value="Other">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="formRegisterRole">
                      <Form.Label className="form-label">Vai trò</Form.Label>
                      <Form.Select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-control-custom"
                        disabled={loading}
                      >
                        <option value="viewer">Người xem</option>
                        <option value="Editor">Biên tập viên</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-4 mt-3">
                  <Col md={12}>
                    <Form.Group controlId="formRegisterBirthday">
                      <Form.Label className="form-label">Ngày sinh</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        required
                        className="form-control-custom"
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-custom rounded-pill mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </Button>
              </Form>
            ) : (
              <Form onSubmit={handleVerifySubmit}>
                <Form.Group controlId="formVerifyCode">
                  <Form.Label className="form-label">Nhập mã xác thực</Form.Label>
                  <Form.Control
                    type="text"
                    value={verifyCodeInput}
                    onChange={(e) => setVerifyCodeInput(e.target.value)}
                    placeholder="Nhập mã xác thực từ email"
                    required
                    className="form-control-custom"
                    disabled={loading}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 btn-custom rounded-pill mt-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Đang xác thực...
                    </>
                  ) : (
                    'Xác thực'
                  )}
                </Button>

                <div className="text-center mt-3">
                  <p className="mb-0 link-text">
                    Không nhận được mã?{' '}
                    <Button
                      variant="link"
                      className="p-0 text-primary link-text"
                      onClick={() => sendVerificationEmail(formData.email)}
                      disabled={loading}
                    >
                      Gửi lại mã
                    </Button>
                  </p>
                </div>
              </Form>
            )}

            {!isRegistered && (
              <div className="text-center mt-3">
                <p className="mb-0 link-text">
                  Đã có tài khoản?{' '}
                  <Button
                    variant="link"
                    className="p-0 text-primary link-text"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Quay lại đăng nhập
                  </Button>
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default Register;