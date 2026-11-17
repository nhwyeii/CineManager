-- Bổ sung poster một lần cho các phim mẫu trong CSDL cũ chưa có ảnh.
WITH samples(id, title, url) AS (
  VALUES
    (1, 'Truy Kích', '/assets/posters/truy-kich.jpg'),
    (2, 'Chuyến phiêu lưu kỳ diệu', '/assets/posters/chuyen-phieu-luu-ky-dieu.jpg'),
    (3, 'Chuyện tình mùa thu', '/assets/posters/chuyen-tinh-mua-thu.jpg'),
    (4, 'Kinh dị đêm khuya', '/assets/posters/kinh-di-dem-khuya.jpg'),
    (5, 'Nhà có khách', '/assets/posters/nha-co-khach.jpg'),
    (6, 'Biển xanh', '/assets/posters/bien-xanh.jpg'),
    (7, 'Mật mã thời gian', '/assets/posters/mat-ma-thoi-gian.jpg'),
    (8, 'Cuộc đua sinh tử', '/assets/posters/cuoc-dua-sinh-tu.jpg'),
    (9, 'Mùa hè rực rỡ', '/assets/posters/mua-he-ruc-ro.jpg'),
    (10, 'Ngôi nhà ma ám', '/assets/posters/ngoi-nha-ma-am.jpg')
)
UPDATE movies AS m
SET poster_url = samples.url
FROM samples
WHERE m.id = samples.id AND m.title = samples.title AND m.poster_url = '';
