-- ERP Lite Database Setup
CREATE DATABASE IF NOT EXISTS erp_db;
USE erp_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  department VARCHAR(50),
  position VARCHAR(100),
  salary DECIMAL(10,2) DEFAULT 0,
  hire_date DATE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products / Inventory table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  category VARCHAR(80),
  quantity INT DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0,
  reorder_level INT DEFAULT 10,
  supplier VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  employee_id INT,
  customer_name VARCHAR(100),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- Seed admin user (password: password)
INSERT IGNORE INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@erp.com', '$2b$10$vHojhcMAF5SYZYgWYfRRjeWOvE6CjW/75D.3.Vep2envuyhJ8uzZG', 'admin');

-- Seed sample data
INSERT IGNORE INTO employees (name, email, phone, department, position, salary, hire_date) VALUES
('Alice Johnson', 'alice@erp.com', '555-0101', 'Sales', 'Sales Manager', 75000, '2022-03-15'),
('Bob Smith', 'bob@erp.com', '555-0102', 'IT', 'Developer', 65000, '2021-07-01'),
('Carol White', 'carol@erp.com', '555-0103', 'HR', 'HR Executive', 55000, '2023-01-10'),
('David Brown', 'david@erp.com', '555-0104', 'Sales', 'Sales Rep', 45000, '2023-06-20'),
('Eva Green', 'eva@erp.com', '555-0105', 'Finance', 'Accountant', 60000, '2022-09-05');

INSERT IGNORE INTO products (name, sku, category, quantity, unit_price, reorder_level, supplier) VALUES
('Laptop Pro 15', 'LAP-001', 'Electronics', 45, 1299.99, 10, 'TechSupply Co'),
('Wireless Mouse', 'MOU-001', 'Electronics', 8, 29.99, 20, 'Gadget World'),
('Office Chair', 'CHR-001', 'Furniture', 12, 349.99, 5, 'OfficeFurn Ltd'),
('Monitor 27"', 'MON-001', 'Electronics', 3, 499.99, 8, 'TechSupply Co'),
('USB Hub 7-Port', 'USB-001', 'Accessories', 150, 39.99, 30, 'Gadget World'),
('Standing Desk', 'DSK-001', 'Furniture', 7, 599.99, 5, 'OfficeFurn Ltd'),
('Mechanical Keyboard', 'KEY-001', 'Electronics', 25, 89.99, 15, 'TypeMaster'),
('Webcam HD', 'CAM-001', 'Electronics', 6, 79.99, 10, 'VisionTech');

INSERT INTO sales (product_id, employee_id, customer_name, quantity, unit_price, total_amount, status, sale_date) VALUES
(1, 1, 'Acme Corp', 2, 1299.99, 2599.98, 'completed', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 4, 'Beta LLC', 10, 39.99, 399.90, 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3, 1, 'Gamma Inc', 3, 349.99, 1049.97, 'completed', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 2, 'Delta Co', 5, 89.99, 449.95, 'completed', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 4, 'Epsilon Ltd', 8, 29.99, 239.92, 'completed', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4, 1, 'Zeta Group', 2, 499.99, 999.98, 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8, 3, 'Eta Partners', 4, 79.99, 319.96, 'pending', NOW()),
(6, 2, 'Theta Corp', 1, 599.99, 599.99, 'completed', NOW());
