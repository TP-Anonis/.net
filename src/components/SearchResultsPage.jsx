import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { mockArticles } from '../data/mockData'; // Sử dụng named import ở đây

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('query') || '';
  const category = queryParams.get('category') || '';

  const [results, setResults] = useState([]);

  useEffect(() => {
    // Logic tìm kiếm
    const filteredArticles = mockArticles.filter((article) => {
      const matchesQuery = searchQuery
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesCategory = category ? article.category === category : true;

      return matchesQuery && matchesCategory;
    });

    setResults(filteredArticles);
  }, [searchQuery, category]);

  const handleViewArticle = (article) => {
    navigate(`/news/${encodeURIComponent(article.title)}`, { state: { article } });
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="my-5 flex-grow-1">
        <h2>Kết quả tìm kiếm</h2>
        {searchQuery && <p>Từ khóa: <strong>{searchQuery}</strong></p>}
        {category && <p>Chủ đề: <strong>{category}</strong></p>}
        {results.length === 0 ? (
          <p>Không tìm thấy bài viết nào phù hợp.</p>
        ) : (
          <Row>
            {results.map((article) => (
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
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default SearchResultsPage;