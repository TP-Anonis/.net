import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Pagination } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { mockEditors, mockArticles } from '../data/mockData';

const EditorArticles = () => {
  const { editorId } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số bài viết trên mỗi trang

  useEffect(() => {
    const editor = mockEditors.find(ed => ed.id === editorId);
    if (editor) {
      const editorArticles = mockArticles.filter(article => article.authorId === editorId);
      setArticles(editorArticles);
    }
  }, [editorId]);

  // Tính toán phân trang
  const totalPages = Math.ceil(articles.length / itemsPerPage);
  const paginatedArticles = articles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewArticle = (article) => {
    navigate(`/news/${encodeURIComponent(article.title)}`, { state: { article } });
  };

  // Tạo các nút phân trang
  const renderPagination = () => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => setCurrentPage(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.Prev
          onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="my-5 flex-grow-1">
        <h2>Danh sách bài viết của biên tập viên</h2>
        {articles.length === 0 ? (
          <p>Không có bài viết nào từ biên tập viên này.</p>
        ) : (
          <>
            <Row>
              {paginatedArticles.map((article) => (
                <Col md={4} key={article.id} className="mb-4">
                  <Card>
                    <Card.Img
                      variant="top"
                      src={article.thumbnail}
                      alt={article.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                      }}
                    />
                    <Card.Body>
                      <Card.Title>{article.title}</Card.Title>
                      <Card.Text>{article.summary}</Card.Text>
                      <Button
                        variant="primary"
                        onClick={() => handleViewArticle(article)}
                      >
                        Xem chi tiết
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
            {renderPagination()}
          </>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default EditorArticles;