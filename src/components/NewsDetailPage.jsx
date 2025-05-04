import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Dropdown, Alert } from 'react-bootstrap';
import axios from 'axios';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../assets/css/NewsDetailPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_DETAIL = `${API_BASE_URL}/article/api/v1/Article`;
const API_URL_COMMENT = `${API_BASE_URL}/article/api/v1/Comment`;
const API_URL_ARTICLE_STORAGE = `${API_BASE_URL}/article/api/v1/ArticleStorage`;
const API_URL_USER_PROFILE = `${API_BASE_URL}/auth/api/v1/User/profile`;

// Hàm lấy thông tin người dùng và lưu vào localStorage
const fetchUserProfile = async (userAccountId, token) => {
  try {
    const storedUsers = JSON.parse(localStorage.getItem('userMapping')) || {};
    if (storedUsers[userAccountId]) {
      return storedUsers[userAccountId];
    }

    const response = await axios.get(`${API_URL_USER_PROFILE}?accountId=${userAccountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const userData = response.data;
    storedUsers[userAccountId] = userData.fullName;
    localStorage.setItem('userMapping', JSON.stringify(storedUsers));
    return userData.fullName;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error);
    return userAccountId; // Trả về userAccountId nếu lỗi
  }
};

const CommentSection = ({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddReply,
  onDeleteAllComments,
  onToggleVisibility,
  currentUser,
  userMapping,
  sortBy,
  setSortBy,
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      await onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (replyText[commentId]?.trim()) {
      await onAddReply(commentId, replyText[commentId]);
      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setShowReplyForm((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplyForm = (commentId) => {
    setShowReplyForm((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleEditComment = (commentId, text) => {
    setEditCommentId(commentId);
    setEditCommentText(text);
  };

  const handleSaveEditComment = async (commentId) => {
    if (editCommentText.trim()) {
      await onEditComment(commentId, editCommentText);
      setEditCommentId(null);
      setEditCommentText('');
    }
  };

  const handleCancelEdit = () => {
    setEditCommentId(null);
    setEditCommentText('');
  };

  const sortedComments = [...comments].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="comment-section mt-5">
      <h5 className="mb-3 comment-title">Chia sẻ ý kiến của bạn</h5>
      <Form onSubmit={handleCommentSubmit}>
        <Form.Group className="mb-3">
          <Form.Control
            as="textarea"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            className="comment-textarea"
          />
        </Form.Group>
        <Button variant="primary" type="submit" className="comment-submit-btn">
          Gửi bình luận
        </Button>
      </Form>

      <div className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="comment-title">Bình luận ({comments.length})</h5>
          <div className="d-flex align-items-center">
            <Dropdown onSelect={(key) => setSortBy(key)} className="me-3">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                Sắp xếp: {sortBy === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="newest">Mới nhất</Dropdown.Item>
                <Dropdown.Item eventKey="oldest">Cũ nhất</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            {comments.length > 0 && (
              <Button variant="danger" size="sm" onClick={onDeleteAllComments}>
                Xóa tất cả bình luận
              </Button>
            )}
          </div>
        </div>
        {comments.length === 0 ? (
          <p className="text-muted">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
        ) : (
          sortedComments.map((comment) => (
            <Card key={comment.id} className="mb-3 comment-card">
              <Card.Body>
                <div className="d-flex align-items-start">
                  <img
                    src="https://placehold.co/40x40?text=User"
                    alt="User avatar"
                    className="rounded-circle me-3 comment-avatar"
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center">
                        <span className="comment-username">{userMapping[comment.author] || comment.author}</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="comment-date text-muted">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.author === currentUser && (
                          <div className="ms-3">
                            <Button
                              variant="link"
                              className="text-primary p-0 me-2"
                              onClick={() => handleEditComment(comment.id, comment.text)}
                              title="Chỉnh sửa bình luận"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="link"
                              className="text-danger p-0 me-2"
                              onClick={() => onDeleteComment(comment.id)}
                              title="Xóa bình luận"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                            <Button
                              variant="link"
                              className="text-muted p-0"
                              onClick={() => onToggleVisibility(comment.id)}
                              title={comment.isHiden ? "Hiện bình luận" : "Ẩn bình luận"}
                            >
                              {comment.isHiden ? (
                                <i className="bi bi-eye"></i>
                              ) : (
                                <i className="bi bi-eye-slash"></i>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {comment.isHiden ? (
                      <Card.Text className="text-muted">[Bình luận đã bị ẩn]</Card.Text>
                    ) : editCommentId === comment.id ? (
                      <div className="mt-2">
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className="mb-2"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveEditComment(comment.id)}
                          className="me-2"
                        >
                          Lưu
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                          Hủy
                        </Button>
                      </div>
                    ) : (
                      <Card.Text
                        className="comment-text"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.text) }}
                      />
                    )}
                    {!comment.isHiden && (
                      <div className="comment-actions">
                        <Button
                          variant="link"
                          className="text-muted p-0"
                          onClick={() => toggleReplyForm(comment.id)}
                        >
                          <i className="bi bi-reply"></i> Trả lời
                        </Button>
                      </div>
                    )}

                    {showReplyForm[comment.id] && !comment.isHiden && (
                      <Form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-3 reply-form">
                        <Form.Group className="mb-2">
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={replyText[comment.id] || ''}
                            onChange={(e) =>
                              setReplyText((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            placeholder="Viết câu trả lời của bạn..."
                            className="comment-textarea"
                          />
                        </Form.Group>
                        <Button variant="primary" type="submit" size="sm" className="comment-submit-btn">
                          Gửi trả lời
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ms-2"
                          onClick={() => toggleReplyForm(comment.id)}
                        >
                          Hủy
                        </Button>
                      </Form>
                    )}

                    {comment.replies && comment.replies.length > 0 && !comment.isHiden && (
                      <div className="replies mt-3">
                        {comment.replies.map((reply, replyIndex) => (
                          <Card key={replyIndex} className="mb-2 reply-card">
                            <Card.Body>
                              <div className="d-flex align-items-start">
                                <img
                                  src="https://placehold.co/32x32?text=User"
                                  alt="User avatar"
                                  className="rounded-circle me-2 reply-avatar"
                                />
                                <div>
                                  <span className="comment-username">{userMapping[reply.author] || reply.author}</span>
                                  <span className="comment-date text-muted ms-2">
                                    {new Date(reply.createdAt).toLocaleString()}
                                  </span>
                                  <Card.Text
                                    className="comment-text"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reply.text) }}
                                  />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const NewsDetailPage = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [article, setArticle] = useState(state?.article || null);
  const [loading, setLoading] = useState(!state?.article);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [userMapping, setUserMapping] = useState(JSON.parse(localStorage.getItem('userMapping')) || {});
  const currentUser = '11111111-1111-1111-1111-111111111111';
  const token = localStorage.getItem('token') || '';

  // Lấy thông tin người dùng khi tải bình luận
  useEffect(() => {
    const fetchUserNamesForComments = async () => {
      if (!token || !comments.length) return;

      const updatedMapping = { ...userMapping };
      const uniqueUserIds = [...new Set(comments.map(comment => comment.author))];
      for (const userId of uniqueUserIds) {
        if (!updatedMapping[userId]) {
          const fullName = await fetchUserProfile(userId, token);
          updatedMapping[userId] = fullName;
        }
      }

      // Cập nhật userMapping cho replies
      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
          const replyUserIds = [...new Set(comment.replies.map(reply => reply.author))];
          for (const userId of replyUserIds) {
            if (!updatedMapping[userId]) {
              const fullName = await fetchUserProfile(userId, token);
              updatedMapping[userId] = fullName;
            }
          }
        }
      }

      setUserMapping(updatedMapping);
      localStorage.setItem('userMapping', JSON.stringify(updatedMapping));
    };

    fetchUserNamesForComments();
  }, [comments, token]);

  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!token) {
        setSaveError('Vui lòng đăng nhập để lưu bài viết.');
        return;
      }

      try {
        const response = await axios.get(`${API_URL_ARTICLE_STORAGE}/check`, {
          params: { articleId: id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.statusCode === 200) {
          setIsSaved(response.data.data);
        } else {
          setSaveError('Không thể kiểm tra trạng thái lưu bài viết.');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setSaveError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setSaveError('Lỗi khi kiểm tra trạng thái lưu: ' + (error.response?.data?.message || error.message));
        }
      }
    };

    checkSaveStatus();
  }, [id, token]);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      if (!token) {
        setError('Vui lòng đăng nhập để xem bài viết.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL_ARTICLE_DETAIL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const articleData = response.data?.data;
        if (articleData) {
          setArticle({
            id: articleData.id,
            title: articleData.title,
            thumbnail: articleData.thumbnail,
            content: articleData.content,
            createAt: articleData.createAt,
            category: articleData.category?.name,
            userAccountEmail: articleData.userAccountEmail,
            images: [],
            video: null,
          });
        } else {
          setError('Không tìm thấy bài viết.');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
          setError('Không tìm thấy bài viết.');
        } else {
          setError('Lấy chi tiết bài viết thất bại: ' + (error.response?.data?.message || error.message));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetail();
  }, [id, token]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!token || !article?.id) return;

      try {
        const response = await axios.get(`${API_URL_COMMENT}/article/${article.id}`, {
          params: { pageNumber: 1, pageSize: 10, descending: true },
          headers: { Authorization: `Bearer ${token}` },
        });

        const commentData = response.data?.data?.items || [];
        const savedReplies = JSON.parse(localStorage.getItem(`replies-${article.id}`)) || {};

        const formattedComments = commentData.map((comment) => ({
          id: comment.id,
          text: comment.content,
          createdAt: comment.createdAt,
          replies: savedReplies[comment.id] || [],
          author: comment.userAccountId,
          isHiden: comment.isHiden || false,
        }));

        setComments(formattedComments);
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
          setError('Không tìm thấy bình luận cho bài viết này.');
        } else {
          setError('Lỗi khi lấy danh sách bình luận: ' + (error.response?.data?.message || error.message));
        }
      }
    };

    fetchComments();
  }, [article, token]);

  const handleSaveArticle = async () => {
    if (!token) {
      setSaveError('Vui lòng đăng nhập để lưu bài viết.');
      return;
    }

    try {
      const response = await axios.post(
        API_URL_ARTICLE_STORAGE,
        { articleId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.statusCode === 201) {
        setIsSaved(true);
        setSaveSuccess('Lưu bài viết thành công!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setSaveError('Lưu bài viết thất bại: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setSaveError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setSaveError('Lưu bài viết thất bại: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUnsaveArticle = async () => {
    if (!token) {
      setSaveError('Vui lòng đăng nhập để hủy lưu bài viết.');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL_ARTICLE_STORAGE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.statusCode === 200) {
        setIsSaved(false);
        setSaveSuccess('Hủy lưu bài viết thành công!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setSaveError('Hủy lưu bài viết thất bại: ' + (response.data.message || 'Lỗi không xác định'));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setSaveError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setSaveError('Hủy lưu bài viết thất bại: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleAddComment = async (commentText) => {
    if (!token) {
      setError('Vui lòng đăng nhập để bình luận.');
      return;
    }

    try {
      const response = await axios.post(
        API_URL_COMMENT,
        {
          content: commentText,
          articleId: article.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newComment = {
        id: response.data.data.id,
        text: response.data.data.content,
        createdAt: response.data.data.createdAt,
        replies: [],
        author: response.data.data.userAccountId,
        isHiden: response.data.data.isHiden || false,
      };

      setComments((prevComments) => [newComment, ...prevComments]);

      // Cập nhật userMapping cho người dùng mới
      const updatedMapping = { ...userMapping };
      if (!updatedMapping[newComment.author]) {
        updatedMapping[newComment.author] = await fetchUserProfile(newComment.author, token);
        setUserMapping(updatedMapping);
        localStorage.setItem('userMapping', JSON.stringify(updatedMapping));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 400) {
        setError('Nội dung bình luận không hợp lệ.');
      } else {
        setError('Lỗi khi thêm bình luận: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditComment = async (commentId, newText) => {
    if (!token) {
      setError('Vui lòng đăng nhập để chỉnh sửa bình luận.');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL_COMMENT}/update-content/${commentId}`,
        { content: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedComment = response.data.data;
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                text: updatedComment.content,
                createdAt: updatedComment.createdAt,
                isHiden: updatedComment.isHiden,
              }
            : comment
        )
      );
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền chỉnh sửa bình luận này.');
      } else {
        setError('Lỗi khi chỉnh sửa bình luận: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) {
      setError('Vui lòng đăng nhập để xóa bình luận.');
      return;
    }

    try {
      await axios.delete(`${API_URL_COMMENT}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId));

      const savedReplies = JSON.parse(localStorage.getItem(`replies-${article.id}`)) || {};
      delete savedReplies[commentId];
      localStorage.setItem(`replies-${article.id}`, JSON.stringify(savedReplies));
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền xóa bình luận này.');
      } else {
        setError('Lỗi khi xóa bình luận: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleAddReply = async (commentId, replyText) => {
    const newReply = {
      text: replyText,
      createdAt: new Date().toISOString(),
      author: currentUser,
    };

    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            }
          : comment
      )
    );

    const savedReplies = JSON.parse(localStorage.getItem(`replies-${article.id}`)) || {};
    savedReplies[commentId] = [
      ...(savedReplies[commentId] || []),
      newReply,
    ];
    localStorage.setItem(`replies-${article.id}`, JSON.stringify(savedReplies));

    // Cập nhật userMapping cho người dùng của reply
    const updatedMapping = { ...userMapping };
    if (!updatedMapping[currentUser]) {
      updatedMapping[currentUser] = await fetchUserProfile(currentUser, token);
      setUserMapping(updatedMapping);
      localStorage.setItem('userMapping', JSON.stringify(updatedMapping));
    }
  };

  const handleToggleVisibility = async (commentId) => {
    if (!token) {
      setError('Vui lòng đăng nhập để ẩn/hiện bình luận.');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL_COMMENT}/toggle-visibility/${commentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, isHiden: response.data.data.isHiden }
            : comment
        )
      );
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setError('Bạn không có quyền ẩn/hiện bình luận này.');
      } else {
        setError('Lỗi khi ẩn/hiện bình luận: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteAllComments = async () => {
    if (!token) {
      setError('Vui lòng đăng nhập để xóa tất cả bình luận.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả bình luận?')) {
      return;
    }

    try {
      await Promise.all(
        comments.map((comment) =>
          axios.delete(`${API_URL_COMMENT}/${comment.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      setComments([]);
      localStorage.removeItem(`replies-${article.id}`);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Lỗi khi xóa tất cả bình luận: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <h3 className="my-5 text-center">Đang tải...</h3>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container>
        <h3 className="my-5 text-center">{error || 'Không tìm thấy bài viết'}</h3>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      <Header />
      <Container className="my-5">
        <Row>
          <Col md={8}>
            <h1 className="mb-3">{article.title}</h1>
            <div className="article-meta mb-4">
              <span className="text-muted">
                Đăng ngày: {new Date(article.createAt).toLocaleString()} | Tác giả: {article.userAccountEmail}
              </span>
            </div>
            <div className="mb-4">
              {saveError && <Alert variant="danger">{saveError}</Alert>}
              {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
              <Button
                variant={isSaved ? "outline-danger" : "outline-primary"}
                onClick={isSaved ? handleUnsaveArticle : handleSaveArticle}
              >
                {isSaved ? (
                  <>
                    <i className="bi bi-bookmark-fill me-1"></i> Hủy lưu
                  </>
                ) : (
                  <>
                    <i className="bi bi-bookmark me-1"></i> Lưu bài viết
                  </>
                )}
              </Button>
            </div>
            <img
              src={article.thumbnail}
              alt={article.title}
              className="img-fluid mb-4"
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
              }}
            />
            <div className="article-content">
              <div
                className="content-text"
                style={{ lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              />

              {article.images && article.images.length > 0 && (
                <div className="article-images mt-4">
                  <h5>Hình ảnh minh họa</h5>
                  <Row>
                    {article.images.map((img, index) => (
                      <Col md={6} key={index} className="mb-3">
                        <img
                          src={img}
                          alt={`Hình ảnh minh họa ${index + 1}`}
                          className="img-fluid"
                          style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
                          }}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {article.video && (
                <div className="article-video mt-4">
                  <h5>Video liên quan</h5>
                  <div className="embed-responsive embed-responsive-16by9">
                    <iframe
                      className="embed-responsive-item"
                      src={article.video}
                      title="Video bài viết"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      style={{ width: '100%', height: '400px', borderRadius: '8px' }}
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
            <CommentSection
              comments={comments}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onAddReply={handleAddReply}
              onDeleteAllComments={handleDeleteAllComments}
              onToggleVisibility={handleToggleVisibility}
              currentUser={currentUser}
              userMapping={userMapping}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </Col>
        </Row>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Container>
      <Footer />
    </Container>
  );
};

export default NewsDetailPage;