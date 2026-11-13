CREATE DATABASE CineManager;
GO

USE CineManager;
GO

-- 1. Tài khoản và phân quyền
CREATE TABLE dbo.nguoi_dung (
    ma_nguoi_dung INT IDENTITY(1,1) PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    ho_ten NVARCHAR(100) NOT NULL,
    mat_khau_bam VARCHAR(255) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL DEFAULT 'khach_hang'
        CHECK (vai_tro IN ('khach_hang', 'quan_tri')),
    dang_hoat_dong BIT NOT NULL DEFAULT 1
);

-- 2. Danh sách phim
CREATE TABLE dbo.phim (
    ma_phim INT IDENTITY(1,1) PRIMARY KEY,
    ten_phim NVARCHAR(150) NOT NULL,
    the_loai NVARCHAR(50) NOT NULL,
    thoi_luong_phut INT NOT NULL CHECK (thoi_luong_phut > 0),
    mo_ta NVARCHAR(500) NULL
);

-- 3. Phòng chiếu
CREATE TABLE dbo.phong_chieu (
    ma_phong INT IDENTITY(1,1) PRIMARY KEY,
    ten_phong NVARCHAR(50) NOT NULL UNIQUE,
    suc_chua INT NOT NULL CHECK (suc_chua > 0)
);

-- 4. Suất chiếu
CREATE TABLE dbo.suat_chieu (
    ma_suat_chieu INT IDENTITY(1,1) PRIMARY KEY,
    ma_phim INT NOT NULL REFERENCES dbo.phim(ma_phim),
    ma_phong INT NOT NULL REFERENCES dbo.phong_chieu(ma_phong),
    gio_bat_dau DATETIME2(0) NOT NULL,
    gio_ket_thuc DATETIME2(0) NOT NULL,
    gia_ve INT NOT NULL CHECK (gia_ve >= 0),

    CONSTRAINT CK_suat_chieu_thoi_gian
        CHECK (gio_ket_thuc > gio_bat_dau),
    CONSTRAINT UQ_suat_chieu_phong_gio
        UNIQUE (ma_phong, gio_bat_dau)
);

-- 5. Lượt đặt vé
CREATE TABLE dbo.dat_ve (
    ma_dat_ve INT IDENTITY(1,1) PRIMARY KEY,
    ma_nguoi_dung INT NOT NULL REFERENCES dbo.nguoi_dung(ma_nguoi_dung),
    ma_suat_chieu INT NOT NULL REFERENCES dbo.suat_chieu(ma_suat_chieu),
    so_luong INT NOT NULL CHECK (so_luong > 0),
    don_gia_luc_dat INT NOT NULL CHECK (don_gia_luc_dat >= 0),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'da_xac_nhan'
        CHECK (trang_thai IN ('da_xac_nhan', 'da_huy')),
    ngay_dat DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);