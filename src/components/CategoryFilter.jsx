import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onCategorySelect }) => {
  return (
    <div className="d-inline-block mb-3" style={{ width: '200px' }}>
      <select
        className="form-select form-select-sm"
        value={selectedCategory}
        onChange={(e) => onCategorySelect(e.target.value)}
      >
        <option value="">Chọn danh mục</option>
        {categories.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;