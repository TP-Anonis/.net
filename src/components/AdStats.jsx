import React from 'react';
import { Container, Table, Tabs, Tab } from 'react-bootstrap';
import Header from './Header';
import Footer from './Footer';
import { FaMousePointer, FaMoneyBillWave, FaUsers } from 'react-icons/fa';

// Dữ liệu giả lập
const mockAdvertisers = [
  { id: 1, name: 'Công ty A', duration: '6 tháng', posts: 10, totalValue: 50000000 },
  { id: 2, name: 'Công ty B', duration: '3 tháng', posts: 5, totalValue: 20000000 },
  { id: 3, name: 'Công ty C', duration: '12 tháng', posts: 15, totalValue: 100000000 },
];

const mockAds = [
  { id: 1, name: 'Quảng cáo A', clicks: 300, advertiser: 'Công ty A' },
  { id: 2, name: 'Quảng cáo B', clicks: 150, advertiser: 'Công ty B' },
  { id: 3, name: 'Quảng cáo C', clicks: 148, advertiser: 'Công ty C' },
];

const mockPopularity = [
  { gender: 'Nam', age20_30: 500, age30_40: 300, age40Plus: 100 },
  { gender: 'Nữ', age20_30: 700, age30_40: 400, age40Plus: 150 },
];

const AdStats = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* CSS tùy chỉnh */}
      <style>{`
        .ad-stats-table {
          table-layout: fixed;
          width: 100%;
        }
        .ad-stats-table thead th {
          background-color: #007bff;
          color: white;
          font-weight: 600;
          text-align: center;
        }
        .ad-stats-table tbody tr {
          transition: background-color 0.3s ease;
        }
        .ad-stats-table tbody tr:hover {
          background-color: #f1faff;
        }
        .ad-stats-table td {
          vertical-align: middle;
          text-align: center;
        }
        .ad-stats-table th:nth-child(1),
        .ad-stats-table td:nth-child(1) {
          width: 5%;
        }
        .ad-stats-table .name-column {
          text-align: left;
          font-weight: 500;
          color: #007bff;
        }
        .ad-stats-table .performance-column {
          font-size: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .ad-stats-table .clicks {
          color: #dc3545;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .ad-stats-table .revenue-column {
          color: #17a2b8;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .ad-stats-table .clicks svg,
        .ad-stats-table .revenue-column svg {
          font-size: 1rem;
        }
        @media (max-width: 576px) {
          .ad-stats-table .performance-column,
          .ad-stats-table .revenue-column {
            font-size: 0.9rem;
          }
          .ad-stats-table .clicks svg,
          .ad-stats-table .revenue-column svg {
            font-size: 0.9rem;
          }
        }
      `}</style>

      <Header />
      <Container className="my-5 flex-grow-1">
        <h1 className="mb-4 text-center" style={{ color: '#333', fontWeight: 'bold' }}>
          Thống kê quảng cáo
        </h1>
        <Tabs defaultActiveKey="advertisers" id="ad-stats-tabs" className="mb-5">
          {/* Tab 1: Thống kê nhà quảng cáo */}
          <Tab eventKey="advertisers" title="Nhà quảng cáo">
            <Table striped bordered hover responsive className="ad-stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên nhà quảng cáo</th>
                  <th>Thời gian hợp tác</th>
                  <th>Số lượng bài viết</th>
                  <th>Tổng giá trị hợp tác (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {mockAdvertisers.map((advertiser, index) => (
                  <tr key={advertiser.id}>
                    <td>{index + 1}</td>
                    <td className="name-column">{advertiser.name}</td>
                    <td>{advertiser.duration}</td>
                    <td>{advertiser.posts}</td>
                    <td className="revenue-column">
                      <FaMoneyBillWave /> {advertiser.totalValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>

          {/* Tab 2: Thống kê quảng cáo theo lượt click */}
          <Tab eventKey="ads" title="Quảng cáo theo lượt click">
            <Table striped bordered hover responsive className="ad-stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tên quảng cáo</th>
                  <th>Nhà quảng cáo</th>
                  <th>Lượt click</th>
                </tr>
              </thead>
              <tbody>
                {mockAds.map((ad, index) => (
                  <tr key={ad.id}>
                    <td>{index + 1}</td>
                    <td className="name-column">{ad.name}</td>
                    <td>{ad.advertiser}</td>
                    <td className="clicks">
                      <FaMousePointer /> {ad.clicks.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>

          {/* Tab 3: Thống kê độ phổ biến theo giới tính và độ tuổi */}
          <Tab eventKey="popularity" title="Độ phổ biến">
            <Table striped bordered hover responsive className="ad-stats-table">
              <thead>
                <tr>
                  <th>Giới tính</th>
                  <th>20-30 tuổi</th>
                  <th>30-40 tuổi</th>
                  <th>Trên 40 tuổi</th>
                </tr>
              </thead>
              <tbody>
                {mockPopularity.map((stat, index) => (
                  <tr key={index}>
                    <td className="name-column">{stat.gender}</td>
                    <td>{stat.age20_30.toLocaleString()}</td>
                    <td>{stat.age30_40.toLocaleString()}</td>
                    <td>{stat.age40Plus.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
      </Container>
      <Footer />
    </div>
  );
};

export default AdStats;