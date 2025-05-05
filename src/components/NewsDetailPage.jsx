import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Dropdown, Alert } from 'react-bootstrap';
import axios from 'axios';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import '../assets/css/NewsDetailPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL_ARTICLE_DETAIL = `${API_BASE_URL}/article/api/v1/Article`;
const API_URL_COMMENT = `${API_BASE_URL}/article/api/v1/Comment`;
const API_URL_ARTICLE_STORAGE = `${API_BASE_URL}/article/api/v1/ArticleStorage`;
const API_URL_USER_PROFILE = `${API_BASE_URL}/auth/api/v1/User/profile`;

const fetchUserProfile = async (userAccountId, token) => {
  try {
    const storedUsers = JSON.parse(localStorage.getItem('userMapping')) || {};
    if (storedUsers[userAccountId]) {
      return storedUsers[userAccountId];
    }

    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const response = await axios.get(`${API_URL_USER_PROFILE}?accountId=${userAccountId}`, config);

    const userData = response.data;
    storedUsers[userAccountId] = userData.fullName;
    localStorage.setItem('userMapping', JSON.stringify(storedUsers));
    return userData.fullName;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin người dùng:', error.response?.data?.message || error.message);
    return userAccountId;
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
  userRole,
  isLoggedIn,
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [showReplyForm, setShowReplyForm] = useState({});
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      console.log('Người dùng chưa đăng nhập, không thể gửi bình luận.');
      return;
    }
    if (newComment.trim()) {
      await onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    if (!isLoggedIn) {
      console.log('Người dùng chưa đăng nhập, không thể gửi câu trả lời.');
      return;
    }
    if (replyText[commentId]?.trim()) {
      await onAddReply(commentId, replyText[commentId]);
      setReplyText((prev) => ({ ...prev, [commentId]: '' }));
      setShowReplyForm((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplyForm = (commentId) => {
    if (!isLoggedIn) {
      console.log('Người dùng chưa đăng nhập, không thể mở form trả lời.');
      return;
    }
    setShowReplyForm((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const handleEditComment = (commentId, text) => {
    if (!isLoggedIn) {
      console.log('Người dùng chưa đăng nhập, không thể chỉnh sửa bình luận.');
      return;
    }
    setEditCommentId(commentId);
    setEditCommentText(text);
  };

  const handleSaveEditComment = async (commentId) => {
    if (!isLoggedIn) {
      console.log('Người dùng chưa đăng nhập, không thể lưu chỉnh sửa bình luận.');
      return;
    }
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
    return sortBy === 'newest'
      ? new Date(b.createdAt) - new Date(a.createdAt)
      : new Date(a.createdAt) - new Date(b.createdAt);
  });

  const canEditDeleteComment = (commentAuthor) => {
    return userRole === 3 || commentAuthor === currentUser;
  };

  const canToggleVisibility = () => {
    return userRole === 3;
  };

  return (
    <div className="comment-section mt-5">
      {isLoggedIn && (
        <>
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
        </>
      )}

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
            {isLoggedIn && comments.length > 0 && userRole === 3 && (
              <Button variant="danger" size="sm" onClick={onDeleteAllComments}>
                Xóa tất cả bình luận
              </Button>
            )}
          </div>
        </div>
        {comments.length === 0 ? (
          <p className="text-muted">Chưa có bình luận nào. Hãy đăng nhập để bình luận!</p>
        ) : (
          sortedComments.map((comment) => (
            <Card key={comment.id} className="mb-3 comment-card">
              <Card.Body>
                <div className="d-flex align-items-start">
                  <img
                    src="https://placehold.co/40x40?text=User"
                    alt="User avatar"
                    className="rounded-circle me-3 comment-avatar"
                    loading="lazy"
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
                        {isLoggedIn && (canEditDeleteComment(comment.author) || userRole === 3) && (
                          <div className="ms-3">
                            <Button
                              variant="link"
                              className="text-primary p-0 me-2"
                              onClick={() => handleEditComment(comment.id, comment.text)}
                              title="Chỉnh sửa bình luận"
                              disabled={!canEditDeleteComment(comment.author)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="link"
                              className="text-danger p-0 me-2"
                              onClick={() => onDeleteComment(comment.id)}
                              title="Xóa bình luận"
                              disabled={!canEditDeleteComment(comment.author)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        )}
                        {isLoggedIn && canToggleVisibility() && (
                          <Button
                            variant="link"
                            className="text-muted p-0"
                            onClick={() => onToggleVisibility(comment.id)}
                            title={comment.isHiden ? 'Hiện bình luận' : 'Ẩn bình luận'}
                          >
                            {comment.isHiden ? (
                              <i className="bi bi-eye"></i>
                            ) : (
                              <i className="bi bi-eye-slash"></i>
                            )}
                          </Button>
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
                    {!comment.isHiden && isLoggedIn && (
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

                    {showReplyForm[comment.id] && !comment.isHiden && isLoggedIn && (
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
                                  loading="lazy"
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
  const { user, isLoggedIn } = useContext(AuthContext);
  const [article, setArticle] = useState(state?.article || null);
  const [loading, setLoading] = useState(!state?.article);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [userMapping, setUserMapping] = useState(JSON.parse(localStorage.getItem('userMapping')) || {});
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const token = localStorage.getItem('token') || '';
  const userRole = user?.roleId || null;
  const commentSectionRef = useRef(null);

  const getAbsoluteThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return 'https://placehold.co/400x300?text=Image+Not+Found';
    return thumbnail.startsWith('/article/uploads/')
      ? `${API_BASE_URL}${thumbnail}`
      : `${API_BASE_URL}/article/uploads/${thumbnail}`;
  };

  useEffect(() => {
    const fetchUserNamesForComments = async () => {
      if (!commentsLoaded || !comments.length) return;

      const updatedMapping = { ...userMapping };
      const uniqueUserIds = [...new Set(comments.map((comment) => comment.author))];
      for (const userId of uniqueUserIds) {
        if (!updatedMapping[userId]) {
          const fullName = await fetchUserProfile(userId, token);
          updatedMapping[userId] = fullName;
        }
      }

      for (const comment of comments) {
        if (comment.replies && comment.replies.length > 0) {
          const replyUserIds = [...new Set(comment.replies.map((reply) => reply.author))];
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
  }, [comments, token, commentsLoaded]);

  useEffect(() => {
    const checkSaveStatus = async () => {
      if (!isLoggedIn || !token) {
        return;
      }

      try {
        const response = await axios.get(`${API_URL_ARTICLE_STORAGE}/check`, {
          params: { articleId: id },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.statusCode === 200) {
          setIsSaved(response.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái lưu:', error.response?.data?.message || error.message);
      }
    };

    checkSaveStatus();
  }, [id, token, isLoggedIn]);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      // Kiểm tra cache
      const cachedArticle = JSON.parse(localStorage.getItem(`article-${id}`));
      if (cachedArticle && cachedArticle.id === id) {
        setArticle(cachedArticle);
        setLoading(false);
        return;
      }

      // Sử dụng dữ liệu từ state nếu có
      if (state?.article && state.article.id === id) {
        setArticle(state.article);
        localStorage.setItem(`article-${id}`, JSON.stringify(state.article));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`${API_URL_ARTICLE_DETAIL}/${id}`, config);

        const articleData = response.data?.data;
        if (articleData) {
          const formattedArticle = {
            id: articleData.id,
            title: articleData.title || 'Tiêu đề không có',
            thumbnail: articleData.thumbnail || '',
            content: articleData.content || '<p>Nội dung không có</p>',
            createAt: articleData.createAt || new Date().toISOString(),
            categoryName: articleData.category?.name || 'Chưa phân loại',
            author: articleData.userDetails?.fullName || 'Chưa xác định',
            userAccountEmail: articleData.userAccountEmail || user?.email || 'Chưa xác định',
            images: [],
            video: null,
          };
          setArticle(formattedArticle);
          localStorage.setItem(`article-${id}`, JSON.stringify(formattedArticle));
        } else {
          setError('Không tìm thấy bài viết.');
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setError('Không tìm thấy bài viết.');
        } else {
          console.error('Lỗi khi lấy chi tiết bài viết:', error.response?.data?.message || error.message);
          setError('Không thể tải bài viết.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetail();
  }, [id, token, user?.email, state]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !commentsLoaded) {
          const fetchComments = async () => {
            try {
              const cachedComments = JSON.parse(localStorage.getItem(`comments-${id}`));
              if (cachedComments) {
                setComments(cachedComments);
                setCommentsLoaded(true);
                return;
              }

              const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
              const response = await axios.get(`${API_URL_COMMENT}/article/${id}`, {
                params: { pageNumber: 1, pageSize: 10, descending: true },
                ...config,
              });

              const commentData = response.data?.data?.items || [];
              const savedReplies = JSON.parse(localStorage.getItem(`replies-${id}`)) || {};

              const formattedComments = commentData.map((comment) => ({
                id: comment.id,
                text: comment.content,
                createdAt: comment.createdAt,
                replies: savedReplies[comment.id] || [],
                author: comment.userAccountId,
                isHiden: comment.isHiden || false,
              }));

              setComments(formattedComments);
              localStorage.setItem(`comments-${id}`, JSON.stringify(formattedComments));
              setCommentsLoaded(true);
            } catch (error) {
              console.error('Lỗi khi lấy danh sách bình luận:', error.response?.data?.message || error.message);
              setCommentsLoaded(true);
            }
          };

          fetchComments();
        }
      },
      { threshold: 0.1 }
    );

    if (commentSectionRef.current) {
      observer.observe(commentSectionRef.current);
    }

    return () => {
      if (commentSectionRef.current) {
        observer.unobserve(commentSectionRef.current);
      }
    };
  }, [id, token, commentsLoaded]);

  const handleSaveArticle = async () => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể lưu bài viết.');
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
      }
    } catch (error) {
      console.error('Lỗi khi lưu bài viết:', error.response?.data?.message || error.message);
    }
  };

  const handleUnsaveArticle = async () => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể hủy lưu bài viết.');
      return;
    }

    try {
      const response = await axios.delete(`${API_URL_ARTICLE_STORAGE}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'Content-Type': 'application/json',
        },
      });

      if (response.data.statusCode === 200) {
        setIsSaved(false);
        setSaveSuccess('Hủy lưu bài viết thành công!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Lỗi khi hủy lưu bài viết:', error.response?.data?.message || error.message);
    }
  };

  const handleAddComment = async (commentText) => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể thêm bình luận.');
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

      setComments((prevComments) => {
        const updatedComments = [newComment, ...prevComments];
        localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
        return updatedComments;
      });

      const updatedMapping = { ...userMapping };
      if (!updatedMapping[newComment.author]) {
        updatedMapping[newComment.author] = await fetchUserProfile(newComment.author, token);
        setUserMapping(updatedMapping);
        localStorage.setItem('userMapping', JSON.stringify(updatedMapping));
      }
    } catch (error) {
      console.error('Lỗi khi thêm bình luận:', error.response?.data?.message || error.message);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể chỉnh sửa bình luận.');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL_COMMENT}/update-content/${commentId}`,
        { content: newText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedComment = response.data.data;
      setComments((prevComments) => {
        const updatedComments = prevComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                text: updatedComment.content,
                createdAt: updatedComment.createdAt,
                isHiden: updatedComment.isHiden,
              }
            : comment
        );
        localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
        return updatedComments;
      });
    } catch (error) {
      console.error('Lỗi khi chỉnh sửa bình luận:', error.response?.data?.message || error.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể xóa bình luận.');
      return;
    }

    try {
      await axios.delete(`${API_URL_COMMENT}/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prevComments) => {
        const updatedComments = prevComments.filter((comment) => comment.id !== commentId);
        localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
        return updatedComments;
      });

      const savedReplies = JSON.parse(localStorage.getItem(`replies-${id}`)) || {};
      delete savedReplies[commentId];
      localStorage.setItem(`replies-${id}`, JSON.stringify(savedReplies));
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error.response?.data?.message || error.message);
    }
  };

  const handleAddReply = async (commentId, replyText) => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể trả lời bình luận.');
      return;
    }

    const newReply = {
      text: replyText,
      createdAt: new Date().toISOString(),
      author: user?.id || '11111111-1111-1111-1111-111111111111',
    };

    setComments((prevComments) => {
      const updatedComments = prevComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            }
          : comment
      );
      localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
      return updatedComments;
    });

    const savedReplies = JSON.parse(localStorage.getItem(`replies-${id}`)) || {};
    savedReplies[commentId] = [...(savedReplies[commentId] || []), newReply];
    localStorage.setItem(`replies-${id}`, JSON.stringify(savedReplies));

    const updatedMapping = { ...userMapping };
    if (!updatedMapping[newReply.author]) {
      updatedMapping[newReply.author] = await fetchUserProfile(newReply.author, token);
      setUserMapping(updatedMapping);
      localStorage.setItem('userMapping', JSON.stringify(updatedMapping));
    }
  };

  const handleToggleVisibility = async (commentId) => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể ẩn/hiện bình luận.');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL_COMMENT}/toggle-visibility/${commentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prevComments) => {
        const updatedComments = prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, isHiden: response.data.data.isHiden }
            : comment
        );
        localStorage.setItem(`comments-${id}`, JSON.stringify(updatedComments));
        return updatedComments;
      });
    } catch (error) {
      console.error('Lỗi khi ẩn/hiện bình luận:', error.response?.data?.message || error.message);
    }
  };

  const handleDeleteAllComments = async () => {
    if (!isLoggedIn || !token) {
      console.log('Người dùng chưa đăng nhập, không thể xóa tất cả bình luận.');
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
      localStorage.removeItem(`comments-${id}`);
      localStorage.removeItem(`replies-${id}`);
    } catch (error) {
      console.error('Lỗi khi xóa tất cả bình luận:', error.response?.data?.message || error.message);
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
                Đăng ngày: {new Date(article.createAt).toLocaleString()} | <strong>Tác giả:</strong> {article.author}
              </span>
            </div>
            {isLoggedIn && (
              <div className="mb-4">
                {saveError && <Alert variant="danger">{saveError}</Alert>}
                {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
                <Button
                  variant={isSaved ? 'outline-danger' : 'outline-primary'}
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
            )}
            <p><strong>Tên danh mục:</strong> {article.categoryName}</p>
            <img
              src={getAbsoluteThumbnailUrl(article.thumbnail)}
              alt={article.title}
              className="img-fluid mb-4"
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://placehold.co/400x300?text=Image+Not+Found';
              }}
              loading="lazy"
            />
            <div className="article-content">
              <div
                className="content-text"
                style={{ lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
              />
              <style jsx>{`
                .content-text img {
                  max-width: 50% !important;
                  max-height: 300px !important;
                  width: auto !important;
                  height: auto !important;
                  object-fit: contain !important;
                  display: block !important;
                  margin: 10px auto !important;
                  border-radius: 8px !important;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                }
              `}</style>

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
                          loading="lazy"
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
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
            <div ref={commentSectionRef}>
              <CommentSection
                comments={comments}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                onAddReply={handleAddReply}
                onDeleteAllComments={handleDeleteAllComments}
                onToggleVisibility={handleToggleVisibility}
                currentUser={user?.id || '11111111-1111-1111-1111-111111111111'}
                userMapping={userMapping}
                sortBy={sortBy}
                setSortBy={setSortBy}
                userRole={userRole}
                isLoggedIn={isLoggedIn}
              />
            </div>
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