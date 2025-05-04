import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';

const Footer = () => (
  <footer className="footer bg-light text-dark py-5">
    <Container>
      <Row>
        <Col md={4} className="mb-3">
          <div className="contact-info">
            <h6 className="fw-bold">Liên hệ</h6>
            <p className="mb-1">1234 Đường Số 1, Quận 1, TP. HCM, Việt Nam</p>
            <p className="mb-1">Điện thoại: (123) 456-7890</p>
            <p className="mb-1">Email: info@vnexpress.com</p>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="footer-links">
            <h6 className="fw-bold">Liên kết</h6>
            <Button variant="link" href="/privacy" className="d-block mb-2 text-dark text-decoration-none">
              Chính sách bảo mật
            </Button>
            <Button variant="link" href="/terms" className="d-block mb-2 text-dark text-decoration-none">
              Điều khoản dịch vụ
            </Button>
            <Button variant="link" href="/sitemap" className="d-block text-dark text-decoration-none">
              Sơ đồ trang web
            </Button>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="copyright text-center">
            <p className="mb-0">© 2025 VNExpress. Mọi quyền được bảo lưu.</p>
          </div>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;