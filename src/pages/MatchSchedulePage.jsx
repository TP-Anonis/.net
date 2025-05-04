import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Badge, Alert } from 'react-bootstrap';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import '../assets/css/MatchSchedulePage.css';

const MatchSchedulePage = () => {
  const [matchSchedule, setMatchSchedule] = useState({ football: {}, basketball: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('football'); // Mặc định là tab "Bóng đá"
  const [activeLeagueTab, setActiveLeagueTab] = useState('V-League'); // Mặc định là tab "V-League"

  const categories = [
    { name: 'football', label: 'Bóng đá' },
    { name: 'basketball', label: 'Bóng rổ' },
  ];

  // Danh sách các giải đấu bóng đá với leagueId
  const footballLeagues = [
    { name: 'V-League', label: 'V-League', leagueId: 278 }, // Giả định, cần kiểm tra API
    { name: 'Premier League', label: 'Ngoại Hạng Anh', leagueId: 152 },
    { name: 'La Liga', label: 'La Liga', leagueId: 207 },
    { name: 'Bundesliga', label: 'Bundesliga', leagueId: 175 },
    { name: 'Champions League', label: 'Champions League', leagueId: 3 },
    { name: 'Europa League', label: 'Europa League', leagueId: 4 },
    { name: 'Other', label: 'Các giải khác', leagueId: null }, // Không cần leagueId
    { name: 'VNExpress Marathon', label: 'VNExpress Marathon', leagueId: null }, // Không có trong API bóng đá
  ];

  const fetchMatchSchedule = async (category, leagueId = null, leagueName = null) => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30); // Lấy dữ liệu 1 tháng tới
      const toDate = nextMonth.toISOString().split('T')[0];
      const cacheKey = `matchSchedule_${category}_${leagueName || category}_${today}`;
      const cacheTimestampKey = `matchScheduleTimestamp_${category}_${leagueName || category}_${today}`;
      const cachedMatches = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(cacheTimestampKey);

      const now = new Date().getTime();
      const cacheExpiration = 60 * 60 * 1000; // 1 giờ
      if (cachedMatches && cachedTimestamp && (now - parseInt(cachedTimestamp) < cacheExpiration)) {
        const cachedData = JSON.parse(cachedMatches);
        setMatchSchedule((prev) => ({
          ...prev,
          [category]: leagueName ? { ...prev[category], [leagueName]: cachedData } : cachedData,
        }));
        setLoading(false);
        return;
      }

      if (cachedTimestamp && (now - parseInt(cachedTimestamp) >= cacheExpiration)) {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimestampKey);
        localStorage.removeItem(`teamLogos_${category}_${leagueName || category}`);
      }

      const sportEndpoints = {
        football: leagueId
          ? `https://apiv2.allsportsapi.com/football/?met=Fixtures&APIkey=6eeb8f02c8e6e497d96c6fa554db8b0f1ed5651f6636cdc575a2d5c2e30ebf44&leagueId=${leagueId}&from=${today}&to=${toDate}`
          : `https://apiv2.allsportsapi.com/football/?met=Fixtures&APIkey=6eeb8f02c8e6e497d96c6fa554db8b0f1ed5651f6636cdc575a2d5c2e30ebf44&from=${today}&to=${toDate}`,
        basketball: `https://apiv2.allsportsapi.com/basketball/?met=Fixtures&APIkey=6eeb8f02c8e6e497d96c6fa554db8b0f1ed5651f6636cdc575a2d5c2e30ebf44&from=${today}&to=${toDate}`,
      };

      let endpoint = sportEndpoints[category];
      let responseData = null;

      if (category === 'football' && leagueName === 'VNExpress Marathon') {
        // Dữ liệu giả cho VNExpress Marathon
        const marathonMatches = [
          {
            date: '2025-04-01, 07:00',
            teams: ['VNExpress Marathon', 'Hà Nội'],
            logos: [null, null],
            live: false,
            finished: false,
            league: 'VNExpress Marathon',
          },
        ];
        setMatchSchedule((prev) => ({
          ...prev,
          football: { ...prev.football, 'VNExpress Marathon': marathonMatches },
        }));
        localStorage.setItem(cacheKey, JSON.stringify(marathonMatches));
        localStorage.setItem(cacheTimestampKey, now.toString());
        setLoading(false);
        return;
      }

      const fixturesResponse = await fetch(endpoint);
      if (!fixturesResponse.ok) {
        throw new Error(`Lỗi từ máy chủ: ${fixturesResponse.status} - ${fixturesResponse.statusText}`);
      }

      responseData = await fixturesResponse.json();

      if (!responseData.success || !responseData.result) {
        throw new Error('Không có lịch thi đấu cho danh mục này');
      }

      console.log(`Dữ liệu từ API cho ${category}${leagueName ? ` - ${leagueName}` : ''}:`, responseData.result); // Debug dữ liệu từ API

      const matches = responseData.result;
      const cachedLogos = JSON.parse(localStorage.getItem(`teamLogos_${category}_${leagueName || category}`)) || {};

      const scheduleWithLogos = await Promise.all(
        matches.map(async (match) => {
          let homeLogo = cachedLogos[match.home_team_key];
          let awayLogo = cachedLogos[match.away_team_key];

          if (!homeLogo) {
            const homeTeamResponse = await fetch(
              `https://apiv2.allsportsapi.com/${category}/?met=Teams&APIkey=6eeb8f02c8e6e497d96c6fa554db8b0f1ed5651f6636cdc575a2d5c2e30ebf44&teamId=${match.home_team_key}`
            );
            if (homeTeamResponse.ok) {
              const homeTeamData = await homeTeamResponse.json();
              homeLogo = homeTeamData.result[0]?.team_logo || null;
              cachedLogos[match.home_team_key] = homeLogo;
            }
          }

          if (!awayLogo) {
            const awayTeamResponse = await fetch(
              `https://apiv2.allsportsapi.com/${category}/?met=Teams&APIkey=6eeb8f02c8e6e497d96c6fa554db8b0f1ed5651f6636cdc575a2d5c2e30ebf44&teamId=${match.away_team_key}`
            );
            if (awayTeamResponse.ok) {
              const awayTeamData = await awayTeamResponse.json();
              awayLogo = awayTeamData.result[0]?.team_logo || null;
              cachedLogos[match.away_team_key] = awayLogo;
            }
          }

          const matchDateTime = new Date(`${match.event_date}T${match.event_time}:00`);
          const now = new Date();
          const isFinished = now > matchDateTime;

          if (!match.event_home_team || !match.event_away_team || !match.event_date || !match.event_time) {
            return null;
          }

          return {
            date: `${match.event_date}, ${match.event_time}`,
            teams: [match.event_home_team, match.event_away_team],
            logos: [homeLogo, awayLogo],
            live: match.event_status === 'Live',
            finished: isFinished,
            league: match.league_name,
          };
        })
      );

      const filteredSchedule = scheduleWithLogos.filter((match) => match !== null);

      if (category === 'football') {
        if (leagueName === 'Other') {
          // Lấy tất cả các trận đấu và lọc ra những trận không thuộc các giải đã liệt kê
          const leagueIds = footballLeagues
            .filter((league) => league.leagueId)
            .map((league) => league.leagueId);
          const otherMatches = filteredSchedule.filter(
            (match) => !leagueIds.includes(match.league_key)
          );
          setMatchSchedule((prev) => ({
            ...prev,
            football: { ...prev.football, Other: otherMatches },
          }));
          localStorage.setItem(cacheKey, JSON.stringify(otherMatches));
        } else if (leagueId) {
          // Lưu dữ liệu cho giải đấu cụ thể
          setMatchSchedule((prev) => ({
            ...prev,
            football: { ...prev.football, [leagueName]: filteredSchedule },
          }));
          localStorage.setItem(cacheKey, JSON.stringify(filteredSchedule));
        }
        localStorage.setItem(`teamLogos_${category}_${leagueName}`, JSON.stringify(cachedLogos));
        localStorage.setItem(cacheTimestampKey, now.toString());
      } else {
        // Xử lý cho bóng rổ
        setMatchSchedule((prev) => ({
          ...prev,
          basketball: filteredSchedule,
        }));
        localStorage.setItem(cacheKey, JSON.stringify(filteredSchedule));
        localStorage.setItem(`teamLogos_${category}`, JSON.stringify(cachedLogos));
        localStorage.setItem(cacheTimestampKey, now.toString());
      }
    } catch (error) {
      console.error(`Lỗi khi lấy lịch thi đấu cho ${category}${leagueName ? ` - ${leagueName}` : ''}:`, error);
      let userMessage = 'Có lỗi xảy ra khi lấy lịch thi đấu. Vui lòng thử lại sau.';
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        userMessage = 'API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.';
      } else if (error.message.includes('Không có lịch thi đấu')) {
        userMessage = 'Không có lịch thi đấu cho danh mục này.';
      }
      setErrorMessage(userMessage);

      // Dữ liệu giả khi có lỗi
      if (category === 'football') {
        const dummyMatches = [
          { date: 'Ngày mai, 16:10', teams: ['Team A', 'Team B'], logos: [null, null], live: false, finished: false, league: leagueName },
        ];
        setMatchSchedule((prev) => ({
          ...prev,
          football: { ...prev.football, [leagueName]: dummyMatches },
        }));
      } else {
        setMatchSchedule((prev) => ({
          ...prev,
          basketball: [
            { date: 'Ngày mai, 17:35', teams: ['Team C', 'Team D'], logos: [null, null], live: true, finished: false },
          ],
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'football') {
      fetchMatchSchedule('football', footballLeagues.find((league) => league.name === activeLeagueTab)?.leagueId, activeLeagueTab);
    } else {
      fetchMatchSchedule('basketball');
    }

    const interval = setInterval(() => {
      if (activeTab === 'football') {
        fetchMatchSchedule('football', footballLeagues.find((league) => league.name === activeLeagueTab)?.leagueId, activeLeagueTab);
      } else {
        fetchMatchSchedule('basketball');
      }
    }, 5 * 60 * 1000); // 5 phút

    return () => clearInterval(interval);
  }, [activeTab, activeLeagueTab]);

  const renderMatchSchedule = (matches, categoryLabel) => {
    if (!matches || (activeTab === 'football' && !matches[activeLeagueTab])) {
      return (
        <Col>
          <p className="text-center text-muted">Không có lịch thi đấu {categoryLabel.toLowerCase()} hôm nay.</p>
        </Col>
      );
    }

    if (loading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <Col xs={6} md={4} lg={2} key={index} className="mb-3">
          <Card className="border-0 schedule-card text-center">
            <Card.Body className="p-2">
              <div className="skeleton skeleton-text mb-2"></div>
              <Row className="align-items-center justify-content-center mb-1">
                <Col xs={5} className="text-end">
                  <div className="skeleton skeleton-logo"></div>
                </Col>
                <Col xs={2} className="text-center">
                  <span className="text-white">vs</span>
                </Col>
                <Col xs={5} className="text-start">
                  <div className="skeleton skeleton-logo"></div>
                </Col>
              </Row>
              <Row className="align-items-center justify-content-center">
                <Col xs={5} className="text-end">
                  <div className="skeleton skeleton-text"></div>
                </Col>
                <Col xs={2}></Col>
                <Col xs={5} className="text-start">
                  <div className="skeleton skeleton-text"></div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      ));
    }

    // Xử lý cho bóng đá (phân theo giải đấu)
    if (activeTab === 'football') {
      const matchesToRender = matches[activeLeagueTab] || [];

      if (matchesToRender.length > 0) {
        return matchesToRender.map((match, index) => (
          <Col xs={6} md={4} lg={2} key={index} className="mb-3">
            <Card className="border-0 schedule-card text-center">
              <Card.Body className="p-3">
                <Card.Text className="small text-white mb-2 match-date">{match.date}</Card.Text>
                <Row className="align-items-center justify-content-center mb-2">
                  <Col xs={5} className="text-end">
                    {match.logos[0] ? (
                      <img
                        src={match.logos[0]}
                        alt={match.teams[0]}
                        className="team-logo"
                        style={{ width: '40px', height: '40px' }}
                        onError={(e) => (e.target.src = '/images/default-logo.png')}
                      />
                    ) : (
                      <img
                        src="/images/default-logo.png"
                        alt={match.teams[0]}
                        className="team-logo"
                        style={{ width: '40px', height: '40px' }}
                      />
                    )}
                  </Col>
                  <Col xs={2} className="text-center">
                    <span className="text-white vs-text">vs</span>
                  </Col>
                  <Col xs={5} className="text-start">
                    {match.logos[1] ? (
                      <img
                        src={match.logos[1]}
                        alt={match.teams[1]}
                        className="team-logo"
                        style={{ width: '40px', height: '40px' }}
                        onError={(e) => (e.target.src = '/images/default-logo.png')}
                      />
                    ) : (
                      <img
                        src="/images/default-logo.png"
                        alt={match.teams[1]}
                        className="team-logo"
                        style={{ width: '40px', height: '40px' }}
                      />
                    )}
                  </Col>
                </Row>
                <Row className="align-items-center justify-content-center">
                  <Col xs={5} className="text-end">
                    <span className="team-name" title={match.teams[0]}>{match.teams[0]}</span>
                  </Col>
                  <Col xs={2}></Col>
                  <Col xs={5} className="text-start">
                    <span className="team-name" title={match.teams[1]}>{match.teams[1]}</span>
                  </Col>
                </Row>
                {match.live && (
                  <Badge bg="danger" className="mt-2 live-badge">
                    <span className="dot"></span> Trực tiếp
                  </Badge>
                )}
                {match.finished && (
                  <Badge bg="secondary" className="mt-2">
                    Đã kết thúc
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>
        ));
      }

      return (
        <Col>
          <p className="text-center text-muted">Không có lịch thi đấu {categoryLabel.toLowerCase()} hôm nay.</p>
        </Col>
      );
    }

    // Xử lý cho bóng rổ (giữ nguyên)
    if (matches.length > 0) {
      return matches.map((match, index) => (
        <Col xs={6} md={4} lg={2} key={index} className="mb-3">
          <Card className="border-0 schedule-card text-center">
            <Card.Body className="p-3">
              <Card.Text className="small text-white mb-2 match-date">{match.date}</Card.Text>
              <Row className="align-items-center justify-content-center mb-2">
                <Col xs={5} className="text-end">
                  {match.logos[0] ? (
                    <img
                      src={match.logos[0]}
                      alt={match.teams[0]}
                      className="team-logo"
                      style={{ width: '40px', height: '40px' }}
                      onError={(e) => (e.target.src = '/images/default-logo.png')}
                    />
                  ) : (
                    <img
                      src="/images/default-logo.png"
                      alt={match.teams[0]}
                      className="team-logo"
                      style={{ width: '40px', height: '40px' }}
                    />
                  )}
                </Col>
                <Col xs={2} className="text-center">
                  <span className="text-white vs-text">vs</span>
                </Col>
                <Col xs={5} className="text-start">
                  {match.logos[1] ? (
                    <img
                      src={match.logos[1]}
                      alt={match.teams[1]}
                      className="team-logo"
                      style={{ width: '40px', height: '40px' }}
                      onError={(e) => (e.target.src = '/images/default-logo.png')}
                    />
                  ) : (
                    <img
                      src="/images/default-logo.png"
                      alt={match.teams[1]}
                      className="team-logo"
                      style={{ width: '40px', height: '40px' }}
                    />
                  )}
                </Col>
              </Row>
              <Row className="align-items-center justify-content-center">
                <Col xs={5} className="text-end">
                  <span className="team-name" title={match.teams[0]}>{match.teams[0]}</span>
                </Col>
                <Col xs={2}></Col>
                <Col xs={5} className="text-start">
                  <span className="team-name" title={match.teams[1]}>{match.teams[1]}</span>
                </Col>
              </Row>
              {match.live && (
                <Badge bg="danger" className="mt-2 live-badge">
                  <span className="dot"></span> Trực tiếp
                </Badge>
              )}
              {match.finished && (
                <Badge bg="secondary" className="mt-2">
                  Đã kết thúc
                </Badge>
              )}
            </Card.Body>
          </Card>
        </Col>
      ));
    }

    return (
      <Col>
        <p className="text-center text-muted">Không có lịch thi đấu {categoryLabel.toLowerCase()} hôm nay.</p>
      </Col>
    );
  };

  return (
    <ErrorBoundary>
      <Container fluid className="p-0">
        <Header />
        <Container className="my-5">
          <h2 className="mb-4">Lịch Thi Đấu</h2>

          {/* Tabs danh mục thể thao */}
          <div className="category-tabs mb-4">
            <Row>
              <Col>
                {categories.map((category) => (
                  <span
                    key={category.name}
                    className={`category-tab ${activeTab === category.name ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(category.name);
                      if (category.name === 'football') {
                        setActiveLeagueTab('V-League'); // Mặc định chọn V-League khi vào tab Bóng đá
                      }
                    }}
                  >
                    {category.label}
                  </span>
                ))}
              </Col>
            </Row>
          </div>

          {/* Tabs chọn giải đấu (chỉ hiển thị khi ở tab Bóng đá) */}
          {activeTab === 'football' && (
            <div className="league-tabs mb-4">
              <Row>
                <Col>
                  {footballLeagues.map((league) => (
                    <span
                      key={league.name}
                      className={`league-tab ${activeLeagueTab === league.name ? 'active' : ''}`}
                      onClick={() => setActiveLeagueTab(league.name)}
                    >
                      {league.label}
                    </span>
                  ))}
                </Col>
              </Row>
            </div>
          )}

          {/* Lịch thi đấu */}
          <div className="match-schedule mb-5">
            {errorMessage && (
              <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                {errorMessage}
              </Alert>
            )}

            <Row className="justify-content-center">
              {renderMatchSchedule(
                activeTab === 'football' ? matchSchedule.football : matchSchedule.basketball,
                activeTab === 'football' ? 'bóng đá' : 'bóng rổ'
              )}
            </Row>
          </div>
        </Container>
        <Footer />
      </Container>
    </ErrorBoundary>
  );
};

export default MatchSchedulePage;