import React, { useState } from 'react';
import { Container, Table, Button, Form, Modal, Badge } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { FaTrash, FaPlus, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const AdBannerManagement = () => {
  const [banners, setBanners] = useState([
    { id: 1, name: 'Banner 1', imageUrl: 'https://placehold.co/300x100?text=Banner1', status: 'approved', display: true },
    { id: 2, name: 'Banner 2', imageUrl: 'https://placehold.co/300x100?text=Banner2', status: 'pending', display: false },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newBanner, setNewBanner] = useState({ name: '', imageFile: null, imagePreview: '' });
  const [editBanner, setEditBanner] = useState(null);

  // Xử lý khi chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setNewBanner({ ...newBanner, imageFile: file, imagePreview: previewUrl });
    }
  };

  // Thêm banner mới
  const handleAddBanner = () => {
    if (newBanner.name && newBanner.imageFile) {
      setBanners([...banners, { 
        id: banners.length + 1, 
        name: newBanner.name, 
        imageUrl: newBanner.imagePreview, // Lưu tạm URL preview
        status: 'pending', 
        display: false 
      }]);
      setShowAddModal(false);
      setNewBanner({ name: '', imageFile: null, imagePreview: '' });
    }
  };

  // Xóa banner
  const handleDeleteBanner = (id) => {
    setBanners(banners.filter(banner => banner.id !== id));
  };

  // Phê duyệt banner
  const handleApproveBanner = (id) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, status: 'approved', display: true } : banner
    ));
  };

  // Từ chối banner
  const handleRejectBanner = (id) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, status: 'rejected', display: false } : banner
    ));
  };

  // Gỡ/Hiển thị banner
  const handleToggleDisplay = (id) => {
    setBanners(banners.map(banner =>
      banner.id === id ? { ...banner, display: !banner.display } : banner
    ));
  };

  // Mở modal chỉnh sửa
  const handleEditBanner = (banner) => {
    setEditBanner(banner);
    setShowEditModal(true);
  };

  // Cập nhật banner
  const handleUpdateBanner = () => {
    if (editBanner.name && editBanner.imageUrl) {
      setBanners(banners.map(banner =>
        banner.id === editBanner.id ? { ...editBanner } : banner
      ));
      setShowEditModal(false);
      setEditBanner(null);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* CSS tùy chỉnh */}
      <style>{`
        .banner-table {
          table-layout: fixed;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .banner-table thead th {
          background-color: #007bff;
          color: white;
          font-weight: 600;
          text-align: center;
          padding: 12px;
        }
        .banner-table tbody tr:hover {
          background-color: #f8f9fa;
        }
        .banner-table td {
          vertical-align: middle;
          text-align: center;
          padding: 10px;
        }
        .banner-table img {
          border-radius: 4px;
          max-width: 120px;
          height: auto;
          transition: transform 0.2s ease;
        }
        .banner-table img:hover {
          transform: scale(1.05);
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .add-btn {
          background-color: #28a745;
          border: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .add-btn:hover {
          background-color: #218838;
        }
        .container-custom {
          background-color: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .modal-header {
          background-color: #007bff;
          color: white;
        }
        .status-pending { color: #ffc107; }
        .status-approved { color: #28a745; }
        .status-rejected { color: #dc3545; }
        .image-preview {
          max-width: 200px;
          margin-top: 10px;
          border-radius: 4px;
        }
      `}</style>

      <Header />
      <Container className="my-5 flex-grow-1 container-custom">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 style={{ color: '#333', fontWeight: 'bold' }}>Quản lý banner quảng cáo</h2>
          <Button className="add-btn" onClick={() => setShowAddModal(true)}>
            <FaPlus /> Thêm banner mới
          </Button>
        </div>

        <Table striped bordered hover responsive className="banner-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tên banner</th>
              <th>Hình ảnh</th>
              <th>Trạng thái</th>
              <th>Hiển thị</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner, index) => (
              <tr key={banner.id}>
                <td>{index + 1}</td>
                <td>{banner.name}</td>
                <td>
                  <img src={banner.imageUrl} alt={banner.name} />
                </td>
                <td>
                  <Badge className={`status-${banner.status}`}>
                    {banner.status === 'pending' ? 'Đang chờ' : banner.status === 'approved' ? 'Đã duyệt' : 'Bị từ chối'}
                  </Badge>
                </td>
                <td>{banner.display ? 'Có' : 'Không'}</td>
                <td>
                  <div className="action-buttons">
                    {banner.status === 'pending' && (
                      <>
                        <Button variant="outline-success" size="sm" onClick={() => handleApproveBanner(banner.id)}>
                          <FaCheck /> Duyệt
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleRejectBanner(banner.id)}>
                          <FaTimes /> Từ chối
                        </Button>
                      </>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={() => handleEditBanner(banner)}>
                      <FaEdit /> Sửa
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleToggleDisplay(banner.id)}
                      disabled={banner.status !== 'approved'}
                    >
                      {banner.display ? 'Gỡ' : 'Hiển thị'}
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteBanner(banner.id)}>
                      <FaTrash /> Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Modal thêm banner mới */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>Thêm banner mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Tên banner</Form.Label>
                <Form.Control
                  type="text"
                  value={newBanner.name}
                  onChange={(e) => setNewBanner({ ...newBanner, name: e.target.value })}
                  placeholder="Nhập tên banner"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Chọn hình ảnh</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {newBanner.imagePreview && (
                  <img src={newBanner.imagePreview} alt="Preview" className="image-preview" />
                )}
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleAddBanner} disabled={!newBanner.name || !newBanner.imageFile}>
              Thêm
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal chỉnh sửa banner */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton className="modal-header">
            <Modal.Title>Chỉnh sửa banner</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editBanner && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tên banner</Form.Label>
                  <Form.Control
                    type="text"
                    value={editBanner.name}
                    onChange={(e) => setEditBanner({ ...editBanner, name: e.target.value })}
                    placeholder="Nhập tên banner"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>URL hình ảnh</Form.Label>
                  <Form.Control
                    type="text"
                    value={editBanner.imageUrl}
                    onChange={(e) => setEditBanner({ ...editBanner, imageUrl: e.target.value })}
                    placeholder="Nhập URL hình ảnh"
                    required
                  />
                </Form.Group>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Đóng
            </Button>
            <Button variant="primary" onClick={handleUpdateBanner} disabled={!editBanner?.name || !editBanner?.imageUrl}>
              Cập nhật
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
      <Footer />
    </div>
  );
};

export default AdBannerManagement;