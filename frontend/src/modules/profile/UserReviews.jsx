import React from 'react';
import { useParams } from 'react-router-dom';
import ReviewList from '../review/ReviewList';
import './UserReviews.css';

const UserReviews = () => {
  const { userId } = useParams();

  return (
    <div className="user-reviews-container">
      <div className="page-header">
        <h1>Đánh giá người bán</h1>
        <p>Xem các đánh giá từ người mua khác</p>
      </div>
      
      <ReviewList userId={userId} showStats={true} />
    </div>
  );
};

export default UserReviews;