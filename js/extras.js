// js/extras.js - 补全原 game.js 中缺失的高阶功能（NPC 深度交互、关系网、地图 DIY、论坛完整版、履历系统等）

(function() {
    'use strict';

    // ==================== 完整头像库（保留原 game.js 中所有 URL） ====================
    const AVATAR_LIBRARY = {
  modern_male: [
    'https://i.postimg.cc/X7tfJxPL/1.png',
    'https://i.postimg.cc/BnDx1H94/10.png',
    'https://i.postimg.cc/NLv0hyNb/100.png',
    'https://i.postimg.cc/VsdD4K3X/101.png',
    'https://i.postimg.cc/pVpqksgG/102.png',
    'https://i.postimg.cc/44qw0zg1/103.png',
    'https://i.postimg.cc/FF8G6jv5/104.png',
    'https://i.postimg.cc/vHnXwc8w/105.png',
    'https://i.postimg.cc/zXhpYVD5/106.png',
    'https://i.postimg.cc/TYbQvp2b/107.png',
    'https://i.postimg.cc/7Zy9Hwbs/108.png',
    'https://i.postimg.cc/52q3jTFG/109.png',
    'https://i.postimg.cc/Hk5Q7XDT/11.png',
    'https://i.postimg.cc/wjcV3Zmp/110.png',
    'https://i.postimg.cc/zGSj36gq/111.png',
    'https://i.postimg.cc/Xvjg5LfW/112.png',
    'https://i.postimg.cc/ZqbLNH8b/113.png',
    'https://i.postimg.cc/jjM44fcn/114.png',
    'https://i.postimg.cc/VNfFtgq9/115.png',
    'https://i.postimg.cc/rpfNN4j1/116.png',
    'https://i.postimg.cc/7LKnnz9B/117.png',
    'https://i.postimg.cc/sX19620d/118.png',
    'https://i.postimg.cc/XJXcHvDN/119.png',
    'https://i.postimg.cc/dVd8TrPs/12.png',
    'https://i.postimg.cc/mDhNXr6z/120.png',
    'https://i.postimg.cc/tTfdLHLs/121.png',
    'https://i.postimg.cc/J0k382LN/122.png',
    'https://i.postimg.cc/NFH8tztY/123.png',
    'https://i.postimg.cc/8c6dG0GG/124.png',
    'https://i.postimg.cc/G38xvHy8/125.png',
    'https://i.postimg.cc/KckDtRM0/126.png',
    'https://i.postimg.cc/WpB68TmV/127.png',
    'https://i.postimg.cc/PfgzyTb5/128.png',
    'https://i.postimg.cc/HWq4zd0L/129.png',
    'https://i.postimg.cc/x1HKbMDT/13.png',
    'https://i.postimg.cc/8k2B4Nd5/130.png',
    'https://i.postimg.cc/RVw1byGc/131.png',
    'https://i.postimg.cc/8zDd84nr/132.png',
    'https://i.postimg.cc/YCkNcRy1/133.png',
    'https://i.postimg.cc/2SmdpGXQ/134.png',
    'https://i.postimg.cc/qvLspKP7/135.png',
    'https://i.postimg.cc/1z3pXtS9/136.png',
    'https://i.postimg.cc/zfGnvBNg/137.png',
    'https://i.postimg.cc/0NypjQvY/138.png',
    'https://i.postimg.cc/yNp0ZH6b/139.png',
    'https://i.postimg.cc/MGS10HqJ/14.png',
    'https://i.postimg.cc/MG31QSZN/140.png',
    'https://i.postimg.cc/rmdxGPK2/141.png',
    'https://i.postimg.cc/wvtL5G7p/142.png',
    'https://i.postimg.cc/xCWH63zC/143.png',
    'https://i.postimg.cc/9MvTLY7G/144.png',
    'https://i.postimg.cc/qR9n1x3F/145.png',
    'https://i.postimg.cc/cCw32tRc/146.png',
    'https://i.postimg.cc/qqyKS6sQ/147.png',
    'https://i.postimg.cc/QC17wKQ6/148.png',
    'https://i.postimg.cc/przj45Q2/149.png',
    'https://i.postimg.cc/mrs73kBZ/15.png',
    'https://i.postimg.cc/dQyGLpb8/150.png',
    'https://i.postimg.cc/gkb8R4pQ/151.png',
    'https://i.postimg.cc/L6FLfvSW/152.png',
    'https://i.postimg.cc/Dy3Ls5Fh/153.png',
    'https://i.postimg.cc/CLpkDJYF/154.png',
    'https://i.postimg.cc/4Nvt1tNK/155.png',
    'https://i.postimg.cc/tCdPzPCF/156.png',
    'https://i.postimg.cc/CLCD4DLm/157.png',
    'https://i.postimg.cc/P5tDVxPF/158.png',
    'https://i.postimg.cc/XYQCRb57/159.png',
    'https://i.postimg.cc/Lspjk526/16.png',
    'https://i.postimg.cc/K8JM62T1/160.png',
    'https://i.postimg.cc/XvqC3zKL/161.png',
    'https://i.postimg.cc/VNvC1V94/162.png',
    'https://i.postimg.cc/3wNv7cj6/163.png',
    'https://i.postimg.cc/xdZbd3tr/164.png',
    'https://i.postimg.cc/gJ6LLLTc/165.png',
    'https://i.postimg.cc/brcDxY7K/166.png',
    'https://i.postimg.cc/mkYc8f4X/167.png',
    'https://i.postimg.cc/PJWL2shs/168.png',
    'https://i.postimg.cc/kGQVf39m/169.png',
    'https://i.postimg.cc/ZqS6Pn4R/17.png',
    'https://i.postimg.cc/XqfZQS3Z/170.png',
    'https://i.postimg.cc/J7ZB1JXc/171.png',
    'https://i.postimg.cc/NGmrgTXV/172.png',
    'https://i.postimg.cc/G3GscYDW/173.png',
    'https://i.postimg.cc/J7ZB1JJM/174.png',
    'https://i.postimg.cc/hP0zmBpm/175.png',
    'https://i.postimg.cc/qvMtX55D/176.png',
    'https://i.postimg.cc/kg12jyrV/177.png',
    'https://i.postimg.cc/K8q195XM/178.png',
    'https://i.postimg.cc/pLGm0BNY/179.png',
    'https://i.postimg.cc/YSHQN0Mj/18.png',
    'https://i.postimg.cc/YCnvXxc3/180.png',
    'https://i.postimg.cc/7L5fjTwk/181.png',
    'https://i.postimg.cc/LXfh8KJ6/182.png',
    'https://i.postimg.cc/wvJ3j812/183.png',
    'https://i.postimg.cc/3RpWx5kn/184.png',
    'https://i.postimg.cc/8cScFKvK/185.png',
    'https://i.postimg.cc/PJjJL3D7/186.png',
    'https://i.postimg.cc/90YMydPv/187.png',
    'https://i.postimg.cc/5yS08BqF/188.png',
    'https://i.postimg.cc/Y26hc7KB/189.png',
    'https://i.postimg.cc/fbNY7yDV/19.png',
    'https://i.postimg.cc/fWcJ4snM/190.png',
    'https://i.postimg.cc/TYThfsfj/191.png',
    'https://i.postimg.cc/qMQqRGvX/192.png',
    'https://i.postimg.cc/X7xqJgYC/193.png',
    'https://i.postimg.cc/WbSz371H/194.png',
    'https://i.postimg.cc/pXkrTBdH/195.png',
    'https://i.postimg.cc/bwJJ22GX/196.png',
    'https://i.postimg.cc/52Rt5Nv8/197.png',
    'https://i.postimg.cc/2SK5d8vZ/198.png',
    'https://i.postimg.cc/76vYcsKk/199.png',
    'https://i.postimg.cc/65Fr3zPM/2.png',
    'https://i.postimg.cc/8CSLdcNJ/20.png',
    'https://i.postimg.cc/xCrT7x6Y/200.png',
    'https://i.postimg.cc/d18tK2fW/201.png',
    'https://i.postimg.cc/kGqMMVrf/202.png',
    'https://i.postimg.cc/Bb4ZZ8Wd/203.png',
    'https://i.postimg.cc/rsMyydXL/204.png',
    'https://i.postimg.cc/FFVsWx3h/205.png',
    'https://i.postimg.cc/5N99ZFSy/206.png',
    'https://i.postimg.cc/QxNNRWJS/207.png',
    'https://i.postimg.cc/TY22ZWJC/208.png',
    'https://i.postimg.cc/4N84ZN8J/209.png',
    'https://i.postimg.cc/GpCvPtdT/21.png',
    'https://i.postimg.cc/1329n7hJ/210.png',
    'https://i.postimg.cc/R0tvc14b/211.png',
    'https://i.postimg.cc/g0hGvymg/212.png',
    'https://i.postimg.cc/gJPm4w0j/213.png',
    'https://i.postimg.cc/W3PTSD4S/214.png',
    'https://i.postimg.cc/85BDY1Jg/215.png',
    'https://i.postimg.cc/MH6x2hRr/216.png',
    'https://i.postimg.cc/Fzrm5239/217.png',
    'https://i.postimg.cc/brmPz39H/218.png',
    'https://i.postimg.cc/mkm4b8yw/219.png',
    'https://i.postimg.cc/HLgb0ndM/22.png',
    'https://i.postimg.cc/6qMK9Yfz/220.png',
    'https://i.postimg.cc/qM70mHpN/221.png',
    'https://i.postimg.cc/02Nxt193/222.png',
    'https://i.postimg.cc/HsPmRvLS/223.png',
    'https://i.postimg.cc/DyYhHpZn/224.png',
    'https://i.postimg.cc/T3Lx6jL5/225.png',
    'https://i.postimg.cc/fRGNT3mH/226.png',
    'https://i.postimg.cc/sgkrDB78/227.png',
    'https://i.postimg.cc/8CLVF1bT/228.png',
    'https://i.postimg.cc/TPnXyRcY/229.png',
    'https://i.postimg.cc/QM3cgChp/23.png',
    'https://i.postimg.cc/ZRZzp1f6/230.png',
    'https://i.postimg.cc/nzkbk05W/231.png',
    'https://i.postimg.cc/gj29B3b9/232.png',
    'https://i.postimg.cc/J0zwdjCC/233.png',
    'https://i.postimg.cc/NFjhPRv6/234.png',
    'https://i.postimg.cc/VvZyy5zR/235.png',
    'https://i.postimg.cc/HW618vby/236.png',
    'https://i.postimg.cc/pVsM5cKj/237.png',
    'https://i.postimg.cc/gk59NwMC/238.png',
    'https://i.postimg.cc/DyDVBWjF/239.png',
    'https://i.postimg.cc/hG1T2ntQ/24.png',
    'https://i.postimg.cc/kXZrfV16/240.png',
    'https://i.postimg.cc/Z5yGgT2F/241.png',
    'https://i.postimg.cc/8CQ2g2gn/242.png',
    'https://i.postimg.cc/GpwWnWnW/243.png',
    'https://i.postimg.cc/R05kxkz5/244.png',
    'https://i.postimg.cc/nLbyfytt/245.png',
    'https://i.postimg.cc/7L3pHKxx/246.png',
    'https://i.postimg.cc/PqWBXStf/247.png',
    'https://i.postimg.cc/XvfTjsVJ/248.png',
    'https://i.postimg.cc/XvfTjsVG/249.png',
    'https://i.postimg.cc/7Ln0K4ZT/25.png',
    'https://i.postimg.cc/3wXP8tKv/250.png',
    'https://i.postimg.cc/43QVWGxz/26.png',
    'https://i.postimg.cc/pdJzsvLf/27.png',
    'https://i.postimg.cc/q7xy1rvX/28.png',
    'https://i.postimg.cc/Ls3LxS8D/29.png',
    'https://i.postimg.cc/5NDB0prk/3.png',
    'https://i.postimg.cc/1zrwvS3b/30.png',
    'https://i.postimg.cc/Jn7JgFsY/31.png',
    'https://i.postimg.cc/FRFcq6fX/32.png',
    'https://i.postimg.cc/qRBnYFtk/33.png',
    'https://i.postimg.cc/rmyWbHdm/34.png',
    'https://i.postimg.cc/SsQ85PXR/35.png',
    'https://i.postimg.cc/bJ6bjRbp/36.png',
    'https://i.postimg.cc/XJ2F0gF7/37.png',
    'https://i.postimg.cc/1tW6ZK6t/38.png',
    'https://i.postimg.cc/63HRNhR7/39.png',
    'https://i.postimg.cc/m2KYDVnd/4.png',
    'https://i.postimg.cc/C1vDV4DB/40.png',
    'https://i.postimg.cc/ydf9zT9m/41.png',
    'https://i.postimg.cc/DZCsKcs5/42.png',
    'https://i.postimg.cc/PJPDf8zY/43.png',
    'https://i.postimg.cc/GtHD3sJF/44.png',
    'https://i.postimg.cc/Fz7SFJgp/45.png',
    'https://i.postimg.cc/fyJdW0jg/46.png',
    'https://i.postimg.cc/7hfzPTMp/47.png',
    'https://i.postimg.cc/gjnhc6H9/48.png',
    'https://i.postimg.cc/C5XqRLcV/49.png',
    'https://i.postimg.cc/BQRT6NzV/5.png',
    'https://i.postimg.cc/4yq9YNW4/50.png',
    'https://i.postimg.cc/L5w1J6x6/51.png',
    'https://i.postimg.cc/7hd25YKJ/52.png',
    'https://i.postimg.cc/SQv8TDkD/53.png',
    'https://i.postimg.cc/c1bY9XdG/54.png',
    'https://i.postimg.cc/7PW7smqx/55.png',
    'https://i.postimg.cc/59Rv7nfN/56.png',
    'https://i.postimg.cc/tCn6LWgR/57.png',
    'https://i.postimg.cc/8PfvqMCj/58.png',
    'https://i.postimg.cc/Nf2XWm06/59.png',
    'https://i.postimg.cc/mgMQFCxw/6.png',
    'https://i.postimg.cc/3J0GPmwj/60.png',
    'https://i.postimg.cc/y8qRBxJp/61.png',
    'https://i.postimg.cc/zGmh5vLc/62.png',
    'https://i.postimg.cc/6pdvQKRD/63.png',
    'https://i.postimg.cc/wjhmBzL8/64.png',
    'https://i.postimg.cc/Bv41LzBj/65.png',
    'https://i.postimg.cc/Bv41LzBb/66.png',
    'https://i.postimg.cc/QMhW9zJ6/67.png',
    'https://i.postimg.cc/yNj3FTLy/68.png',
    'https://i.postimg.cc/3w10gZts/69.png',
    'https://i.postimg.cc/8zWhrM8x/7.png',
    'https://i.postimg.cc/B6vLN1zk/70.png',
    'https://i.postimg.cc/DZzJ5bDz/71.png',
    'https://i.postimg.cc/JnhDKBg0/72.png',
    'https://i.postimg.cc/fLg3PRnb/73.png',
    'https://i.postimg.cc/hjGzM7wd/74.png',
    'https://i.postimg.cc/C5BZppSN/75.png',
    'https://i.postimg.cc/1Xng11sT/76.png',
    'https://i.postimg.cc/tJKsXvg9/77.png',
    'https://i.postimg.cc/MHCnW3Gn/78.png',
    'https://i.postimg.cc/8k9JBcm3/79.png',
    'https://i.postimg.cc/136pNwh1/8.png',
    'https://i.postimg.cc/VsprBvWx/80.png',
    'https://i.postimg.cc/HWRc4nt8/81.png',
    'https://i.postimg.cc/9F94x2xf/82.png',
    'https://i.postimg.cc/ncmsdxdd/83.png',
    'https://i.postimg.cc/rwLD3H3L/84.png',
    'https://i.postimg.cc/7Zy5dRdD/85.png',
    'https://i.postimg.cc/4xbYg5Rk/86.png',
    'https://i.postimg.cc/QdkF3bZs/87.png',
    'https://i.postimg.cc/zfzVXgqv/88.png',
    'https://i.postimg.cc/GpLHhyb8/89.png',
    'https://i.postimg.cc/9QTGqZ5h/9.png',
    'https://i.postimg.cc/SKgjXxKP/90.png',
    'https://i.postimg.cc/GpX9Bm21/91.png',
    'https://i.postimg.cc/9Mz0yHR4/92.png',
    'https://i.postimg.cc/B6tb2fLL/93.png',
    'https://i.postimg.cc/Y9V93DYN/94.png',
    'https://i.postimg.cc/C1t1NrkH/95.png',
    'https://i.postimg.cc/SRMKtLGx/96.png',
    'https://i.postimg.cc/d3y0SR9Q/97.png',
    'https://i.postimg.cc/23N5pqHk/98.png',
    'https://i.postimg.cc/JtChwyTB/99.png',
    'https://i.postimg.cc/SsYKwxJr/QQ20260131-181338.png',
    'https://i.postimg.cc/Y0cSkBWP/QQ20260131-181747.png',
    'https://i.postimg.cc/6qsQwxZ6/QQ20260131-181819.png',
    'https://i.postimg.cc/KjXYFhTY/QQ20260131-181837.png',
    'https://i.postimg.cc/gj90dbh2/QQ20260131-182056.png',
    'https://i.postimg.cc/PJGqhnDC/QQ20260131-182124.png',
    'https://i.postimg.cc/3NgxxfjN/QQ20260131-182142.png',
    'https://i.postimg.cc/5yw22K5N/QQ20260131-182255.png',
    'https://i.postimg.cc/rsSwwZGy/QQ20260131-182310.png',
    'https://i.postimg.cc/zvnGG2wV/QQ20260131-182329.png',
    'https://i.postimg.cc/cCQLLk7B/QQ20260131-182342.png',
    'https://i.postimg.cc/4yzxx2v5/QQ20260131-182412.png',
    'https://i.postimg.cc/dQd16DMc/QQ20260131-182458.png',
    'https://i.postimg.cc/7P769bvH/QQ20260131-182515.png',
    'https://i.postimg.cc/nV7z2M8s/QQ20260131-182603.png',
    'https://i.postimg.cc/65XQmwwT/QQ20260131-182626.png',
    'https://i.postimg.cc/SNhKvqq2/QQ20260131-182802.png',
    'https://i.postimg.cc/dtY0xvvr/QQ20260131-182840.png',
    'https://i.postimg.cc/bNhvB88H/QQ20260131-182904.png',
    'https://i.postimg.cc/xT2d4YYF/QQ20260131-182931.png',
    'https://i.postimg.cc/02sNBxxt/QQ20260131-182947.png',
    'https://i.postimg.cc/Qx3MyssP/QQ20260131-183100.png',
    'https://i.postimg.cc/Hs9LGKs6/QQ20260131-183303.png',
    'https://i.postimg.cc/tCNg0f44/QQ20260131-183528.png',
    'https://i.postimg.cc/3JFwM6x8/QQ20260131-183708.png',
    'https://i.postimg.cc/gkH0952J/QQ20260131-183810.png',
    'https://i.postimg.cc/YC2Ct3v2/QQ20260131-183851.png',
    'https://i.postimg.cc/XYNYn8rJ/QQ20260131-184208.png',
    'https://i.postimg.cc/MpZpzDnv/QQ20260131-184750.png',
    'https://i.postimg.cc/bwYwqTZD/QQ20260131-184838.png',
    'https://i.postimg.cc/6p6pB08d/QQ20260131-185639.png',
    'https://i.postimg.cc/4x8Ny9cH/QQ20260131-185739.png',
    'https://i.postimg.cc/0yt2jwSm/QQ20260131-190059.png',
    'https://i.postimg.cc/nhdcrDmB/QQ20260131-190202.png',
    'https://i.postimg.cc/jS8d27fc/QQ20260131-195439.png',
    'https://i.postimg.cc/9QxF0798/QQ20260131-195500.png',
    'https://i.postimg.cc/MpsKHQRJ/QQ20260131-195516.png',
    'https://i.postimg.cc/52PNyCzZ/QQ20260131-195543.png',
    'https://i.postimg.cc/Lsn418ky/QQ20260131-200058.png',
    'https://i.postimg.cc/cJr1nL7p/QQ20260131-200239.png',
    'https://i.postimg.cc/0Nb5wydv/QQ20260131-200259.png',
    'https://i.postimg.cc/PqPfw5zj/QQ20260131-201142.png',
    'https://i.postimg.cc/8Cjk6zBD/QQ20260131-201311.png',
    'https://i.postimg.cc/bvsYtwHJ/QQ20260131-201324.png',
    'https://i.postimg.cc/FK8rgXDr/QQ20260131-201343.png',
    'https://i.postimg.cc/mrJLNW8b/QQ20260131-201400.png',
    'https://i.postimg.cc/YSZrfBbh/QQ20260131-201509.png',
    'https://i.postimg.cc/KYwGrhJT/QQ20260131-201819.png',
    'https://i.postimg.cc/yNt1XCvL/QQ20260131-202007.png',
    'https://i.postimg.cc/TwbRtN4N/QQ20260131-202112.png',
    'https://i.postimg.cc/Ss9yg1vZ/QQ20260131-202139.png',
    'https://i.postimg.cc/0QS8VXBB/QQ20260131-202153.png',
    'https://i.postimg.cc/xCm06pZD/QQ20260131-202440.png'
  ],
  modern_female: [
    'https://i.postimg.cc/gJpLhTyq/1.png',
    'https://i.postimg.cc/zvXLtHP6/10.png',
    'https://i.postimg.cc/qRBM4VXx/100.png',
    'https://i.postimg.cc/509Nbdqp/101.png',
    'https://i.postimg.cc/0Q52PRdV/102.png',
    'https://i.postimg.cc/sXfDsd9N/103.png',
    'https://i.postimg.cc/qRBM4VXS/104.png',
    'https://i.postimg.cc/MTZKq2b4/105.png',
    'https://i.postimg.cc/sXfDsd9k/106.png',
    'https://i.postimg.cc/zBDX8ZFm/107.png',
    'https://i.postimg.cc/KzcvxSDy/108.png',
    'https://i.postimg.cc/76BPLsmt/109.png',
    'https://i.postimg.cc/WzbDWqfB/11.png',
    'https://i.postimg.cc/RFPC0sXD/110.png',
    'https://i.postimg.cc/85ykCKtY/111.png',
    'https://i.postimg.cc/W39p4WXC/112.png',
    'https://i.postimg.cc/50P9t7sd/113.png',
    'https://i.postimg.cc/sXnf26Tg/114.png',
    'https://i.postimg.cc/G2M3p7Xt/115.png',
    'https://i.postimg.cc/0Qt5NWV6/116.png',
    'https://i.postimg.cc/qqzJ6sFC/117.png',
    'https://i.postimg.cc/L5n9gtWt/118.png',
    'https://i.postimg.cc/brsySx5H/119.png',
    'https://i.postimg.cc/x8TkxN4S/12.png',
    'https://i.postimg.cc/WzhNqGy5/120.png',
    'https://i.postimg.cc/wMZ6XtKX/121.png',
    'https://i.postimg.cc/wMZ6XtK2/122.png',
    'https://i.postimg.cc/90KWd431/123.png',
    'https://i.postimg.cc/5yTxBHcP/124.png',
    'https://i.postimg.cc/zv6JCLm2/125.png',
    'https://i.postimg.cc/HnRpwJGN/126.png',
    'https://i.postimg.cc/HnRpwJGR/127.png',
    'https://i.postimg.cc/nrgH4sbb/128.png',
    'https://i.postimg.cc/zv6JCLZ1/129.png',
    'https://i.postimg.cc/fyT32Srw/13.png',
    'https://i.postimg.cc/jqFd01WL/130.png',
    'https://i.postimg.cc/y6bY4GJZ/131.png',
    'https://i.postimg.cc/VsVLQhSB/132.png',
    'https://i.postimg.cc/2jK8RtqT/133.png',
    'https://i.postimg.cc/y6bY4GJp/134.png',
    'https://i.postimg.cc/v8NHFK1C/135.png',
    'https://i.postimg.cc/yY36VT9v/136.png',
    'https://i.postimg.cc/nc9VH17T/137.png',
    'https://i.postimg.cc/65469hR1/138.png',
    'https://i.postimg.cc/CLnMF4Dt/139.png',
    'https://i.postimg.cc/VvLSG0VL/14.png',
    'https://i.postimg.cc/sDGfVJSq/140.png',
    'https://i.postimg.cc/02K58CmT/141.png',
    'https://i.postimg.cc/GhT3cjG1/142.png',
    'https://i.postimg.cc/Hs8WptXm/143.png',
    'https://i.postimg.cc/nc9VH1BZ/144.png',
    'https://i.postimg.cc/Hs8WptXT/145.png',
    'https://i.postimg.cc/Kv3cZ5BZ/146.png',
    'https://i.postimg.cc/fTSWwvmT/147.png',
    'https://i.postimg.cc/Dy4f2cLZ/148.png',
    'https://i.postimg.cc/nc9VH1BC/149.png',
    'https://i.postimg.cc/tJC1SnMZ/15.png',
    'https://i.postimg.cc/Mpk6Xjmw/150.png',
    'https://i.postimg.cc/Z5kb0yx4/151.png',
    'https://i.postimg.cc/CxyhdfsL/152.png',
    'https://i.postimg.cc/YCcrjmz9/153.png',
    'https://i.postimg.cc/DwVvmbP0/154.png',
    'https://i.postimg.cc/52c4jFSj/155.png',
    'https://i.postimg.cc/Z5kb0yx3/156.png',
    'https://i.postimg.cc/BnWSt1BH/157.png',
    'https://i.postimg.cc/0ygkrJ0Y/158.png',
    'https://i.postimg.cc/sgFj1Z44/159.png',
    'https://i.postimg.cc/4yNKLHSt/16.png',
    'https://i.postimg.cc/T38dhWJ0/160.png',
    'https://i.postimg.cc/8zh1vPZ6/161.png',
    'https://i.postimg.cc/Nj1gXfdm/162.png',
    'https://i.postimg.cc/SxWy9Ngc/163.png',
    'https://i.postimg.cc/13p9F5v0/164.png',
    'https://i.postimg.cc/L8zHP6x3/165.png',
    'https://i.postimg.cc/0yp8S2Vn/166.png',
    'https://i.postimg.cc/jSzsfdM8/167.png',
    'https://i.postimg.cc/vZWQnH0S/168.png',
    'https://i.postimg.cc/6pd9Z5MF/169.png',
    'https://i.postimg.cc/kG12kM06/17.png',
    'https://i.postimg.cc/cLQs34FV/170.png',
    'https://i.postimg.cc/13p9F5WQ/171.png',
    'https://i.postimg.cc/cLQs34DW/172.png',
    'https://i.postimg.cc/CKSwsT23/173.png',
    'https://i.postimg.cc/s2s34d8d/174.png',
    'https://i.postimg.cc/Bv4JB9y4/175.png',
    'https://i.postimg.cc/pdRPJb7P/176.png',
    'https://i.postimg.cc/JhMR5Vgz/177.png',
    'https://i.postimg.cc/cJ0dByjr/178.png',
    'https://i.postimg.cc/9fCcY5SR/179.png',
    'https://i.postimg.cc/Kjq1dc6M/18.png',
    'https://i.postimg.cc/W4TswLKk/180.png',
    'https://i.postimg.cc/mrjBdpfZ/181.png',
    'https://i.postimg.cc/KYfx9pS4/182.png',
    'https://i.postimg.cc/0NnPtXRz/183.png',
    'https://i.postimg.cc/VNgm7ZQX/184.png',
    'https://i.postimg.cc/W48T9YLM/185.png',
    'https://i.postimg.cc/pdCR0cbZ/186.png',
    'https://i.postimg.cc/pdCR0cbk/187.png',
    'https://i.postimg.cc/mDrRK3BN/188.png',
    'https://i.postimg.cc/76LDj1wV/189.png',
    'https://i.postimg.cc/vTq4p8JL/19.png',
    'https://i.postimg.cc/4d3ZjvXk/190.png',
    'https://i.postimg.cc/cHJZP7dN/191.png',
    'https://i.postimg.cc/rmYcTdpF/192.png',
    'https://i.postimg.cc/PxFhHLqt/193.png',
    'https://i.postimg.cc/G2SrRBps/194.png',
    'https://i.postimg.cc/hvzntSJm/195.png',
    'https://i.postimg.cc/ZnBm5T9p/196.png',
    'https://i.postimg.cc/ZnBm5T9F/197.png',
    'https://i.postimg.cc/1XnS39gr/198.png',
    'https://i.postimg.cc/qqhrvktG/199.png',
    'https://i.postimg.cc/tTzZNNDN/2.png',
    'https://i.postimg.cc/brCZKY73/20.png',
    'https://i.postimg.cc/D0Jhw2Wx/200.png',
    'https://i.postimg.cc/1XnS39gC/201.png',
    'https://i.postimg.cc/tJKj1LPk/202.png',
    'https://i.postimg.cc/kG6CgnVp/203.png',
    'https://i.postimg.cc/WzBvDQrf/204.png',
    'https://i.postimg.cc/5yhVHZvR/205.png',
    'https://i.postimg.cc/MHCSchVw/206.png',
    'https://i.postimg.cc/J0fLy9ZR/207.png',
    'https://i.postimg.cc/xjhYFb75/208.png',
    'https://i.postimg.cc/T2FGHWSj/209.png',
    'https://i.postimg.cc/tJSsLRKv/21.png',
    'https://i.postimg.cc/05FxHJFq/210.png',
    'https://i.postimg.cc/Qx7sLdGz/211.png',
    'https://i.postimg.cc/wTNHKjYd/212.png',
    'https://i.postimg.cc/CL8Yyxpw/213.png',
    'https://i.postimg.cc/fTdZ4RQ0/214.png',
    'https://i.postimg.cc/3JG7MxQ4/215.png',
    'https://i.postimg.cc/BnG3JfJL/216.png',
    'https://i.postimg.cc/vZdyGwGv/217.png',
    'https://i.postimg.cc/4xTGXRX2/218.png',
    'https://i.postimg.cc/zGSrB2fj/219.png',
    'https://i.postimg.cc/8cK7qk2n/22.png',
    'https://i.postimg.cc/7ZMk6tLs/220.png',
    'https://i.postimg.cc/T3q6wNw8/221.png',
    'https://i.postimg.cc/FHg4RCRm/222.png',
    'https://i.postimg.cc/6QWNGV7k/223.png',
    'https://i.postimg.cc/tgqHVdZT/224.png',
    'https://i.postimg.cc/rpVLtG00/225.png',
    'https://i.postimg.cc/MG68j0MB/226.png',
    'https://i.postimg.cc/8CZgdFMR/227.png',
    'https://i.postimg.cc/wv38w6QZ/228.png',
    'https://i.postimg.cc/d1DP5q91/229.png',
    'https://i.postimg.cc/SQDYXVnq/23.png',
    'https://i.postimg.cc/V6TyT37Y/230.png',
    'https://i.postimg.cc/brtXj3MC/231.png',
    'https://i.postimg.cc/2yZpf2Jx/232.png',
    'https://i.postimg.cc/D0XVKBHk/233.png',
    'https://i.postimg.cc/c6yp1fGL/234.png',
    'https://i.postimg.cc/XNGXJ36f/235.png',
    'https://i.postimg.cc/447ndZRL/236.png',
    'https://i.postimg.cc/HWcjxHCg/237.png',
    'https://i.postimg.cc/ZYB0RZhJ/238.png',
    'https://i.postimg.cc/L4c5g7Hp/239.png',
    'https://i.postimg.cc/3rn0y9ky/24.png',
    'https://i.postimg.cc/BZrbPyqs/240.png',
    'https://i.postimg.cc/bY7rSMzJ/241.png',
    'https://i.postimg.cc/qBPq6Ykt/242.png',
    'https://i.postimg.cc/VLX6qR6v/243.png',
    'https://i.postimg.cc/BQ26Tg6t/244.png',
    'https://i.postimg.cc/ncqz4kzv/245.png',
    'https://i.postimg.cc/pXKTfZTf/246.png',
    'https://i.postimg.cc/65C3r03b/247.png',
    'https://i.postimg.cc/Wb03Gn3C/248.png',
    'https://i.postimg.cc/fRZbB9tp/249.png',
    'https://i.postimg.cc/gcNLw4xR/25.png',
    'https://i.postimg.cc/Z5ZqVdBG/250.png',
    'https://i.postimg.cc/0yxNcwK5/251.png',
    'https://i.postimg.cc/W1j4Xkq3/252.png',
    'https://i.postimg.cc/jSXS9SyC/253.png',
    'https://i.postimg.cc/sgcg8g5B/254.png',
    'https://i.postimg.cc/4x5xMxpp/255.png',
    'https://i.postimg.cc/FHZHqH0x/256.png',
    'https://i.postimg.cc/W411Pc7k/257.png',
    'https://i.postimg.cc/vmZZdwvf/258.png',
    'https://i.postimg.cc/R0ZZzxTR/259.png',
    'https://i.postimg.cc/BQbL2DFF/26.png',
    'https://i.postimg.cc/25SSfNwp/260.png',
    'https://i.postimg.cc/HLvsYvZC/261.png',
    'https://i.postimg.cc/vm2HY2qY/262.png',
    'https://i.postimg.cc/W3DphmC4/263.png',
    'https://i.postimg.cc/76CPf1dJ/264.png',
    'https://i.postimg.cc/C1ZMzCX7/265.png',
    'https://i.postimg.cc/B6dSDLfC/266.png',
    'https://i.postimg.cc/bJKybDj8/267.png',
    'https://i.postimg.cc/qqykGJky/268.png',
    'https://i.postimg.cc/2jZ8Ywns/269.png',
    'https://i.postimg.cc/7YhGS7z1/27.png',
    'https://i.postimg.cc/MKJZpQDx/270.png',
    'https://i.postimg.cc/RVxCZHR0/271.png',
    'https://i.postimg.cc/ZKzY5dcp/272.png',
    'https://i.postimg.cc/28NjSZw7/273.png',
    'https://i.postimg.cc/bN0yDwCT/274.png',
    'https://i.postimg.cc/RZMMcx2x/275.png',
    'https://i.postimg.cc/2S2CGXfq/276.png',
    'https://i.postimg.cc/mrkB5Nbw/277.png',
    'https://i.postimg.cc/3wNYcC85/278.png',
    'https://i.postimg.cc/7LRw8Gh5/279.png',
    'https://i.postimg.cc/ZKnB63NH/28.png',
    'https://i.postimg.cc/C1fYFhnf/280.png',
    'https://i.postimg.cc/4dhZJfHS/281.png',
    'https://i.postimg.cc/zvZNvsTx/282.png',
    'https://i.postimg.cc/3N5hNsgK/283.png',
    'https://i.postimg.cc/MH2wHCyp/284.png',
    'https://i.postimg.cc/D0rTXxg7/285.png',
    'https://i.postimg.cc/kGQmbTcB/286.png',
    'https://i.postimg.cc/Vvq8CKR0/287.png',
    'https://i.postimg.cc/brxhtmT0/288.png',
    'https://i.postimg.cc/vTrsV0zz/289.png',
    'https://i.postimg.cc/4Ny7ptcW/29.png',
    'https://i.postimg.cc/RCK9y0BM/290.png',
    'https://i.postimg.cc/kMK9z5m4/291.png',
    'https://i.postimg.cc/G3GrVpCy/292.png',
    'https://i.postimg.cc/CL0YgVhd/293.png',
    'https://i.postimg.cc/J48mLWrZ/294.png',
    'https://i.postimg.cc/L6SRpM9j/295.png',
    'https://i.postimg.cc/15SPQZmr/296.png',
    'https://i.postimg.cc/dt9FQS3n/297.png',
    'https://i.postimg.cc/4N1G4Fy2/298.png',
    'https://i.postimg.cc/jSdbDQJr/299.png',
    'https://i.postimg.cc/26xb77TT/3.png',
    'https://i.postimg.cc/KvjktLT9/30.png',
    'https://i.postimg.cc/Jz6WZDbt/300.png',
    'https://i.postimg.cc/4Ny7ptcj/31.png',
    'https://i.postimg.cc/28ybnvvf/32.png',
    'https://i.postimg.cc/9Fk4bMP6/33.png',
    'https://i.postimg.cc/kXHVs4F3/34.png',
    'https://i.postimg.cc/wTrt2vcH/35.png',
    'https://i.postimg.cc/VLhSg6B5/36.png',
    'https://i.postimg.cc/4N0KPdbd/37.png',
    'https://i.postimg.cc/NfnyDM7y/38.png',
    'https://i.postimg.cc/FHJYB4DK/39.png',
    'https://i.postimg.cc/50mYSSps/4.png',
    'https://i.postimg.cc/3xDkcTnG/40.png',
    'https://i.postimg.cc/Bn1jV0MM/41.png',
    'https://i.postimg.cc/Gms45Cq7/42.png',
    'https://i.postimg.cc/cJyvqbbM/43.png',
    'https://i.postimg.cc/xdDXr444/44.png',
    'https://i.postimg.cc/pdbmN6Sb/45.png',
    'https://i.postimg.cc/3w5kMcqM/46.png',
    'https://i.postimg.cc/6QJ8smPw/47.png',
    'https://i.postimg.cc/LstnmVdS/48.png',
    'https://i.postimg.cc/KYPRm5Xy/49.png',
    'https://i.postimg.cc/RFT6LLGX/5.png',
    'https://i.postimg.cc/436mX1C9/50.png',
    'https://i.postimg.cc/G2b9tsrT/51.png',
    'https://i.postimg.cc/zBq3vR5W/52.png',
    'https://i.postimg.cc/0Q9rjJxd/53.png',
    'https://i.postimg.cc/pTPyrnxZ/54.png',
    'https://i.postimg.cc/wv93MsHk/55.png',
    'https://i.postimg.cc/sX31xZyK/56.png',
    'https://i.postimg.cc/QtjVCWs0/57.png',
    'https://i.postimg.cc/hjKhv7gy/58.png',
    'https://i.postimg.cc/pTPyrnx7/59.png',
    'https://i.postimg.cc/TwcLJJQs/6.png',
    'https://i.postimg.cc/Y980Wqq3/60.png',
    'https://i.postimg.cc/ydnxZYYn/61.png',
    'https://i.postimg.cc/FRGzLssW/62.png',
    'https://i.postimg.cc/gJ4jZkkQ/63.png',
    'https://i.postimg.cc/76Xh2YYj/64.png',
    'https://i.postimg.cc/1tMXq53S/65.png',
    'https://i.postimg.cc/vBXTVHZm/66.png',
    'https://i.postimg.cc/k4wGbXgG/67.png',
    'https://i.postimg.cc/5y00qdXb/68.png',
    'https://i.postimg.cc/4yddbkYN/69.png',
    'https://i.postimg.cc/JnQD55Kf/7.png',
    'https://i.postimg.cc/ZnRRFtWW/70.png',
    'https://i.postimg.cc/Y099fKvG/71.png',
    'https://i.postimg.cc/Wz336LdM/72.png',
    'https://i.postimg.cc/zvBBSZyS/73.png',
    'https://i.postimg.cc/Y099fKv3/74.png',
    'https://i.postimg.cc/Y0sSdnF8/75.png',
    'https://i.postimg.cc/cCbJF93k/76.png',
    'https://i.postimg.cc/fyrb82d6/77.png',
    'https://i.postimg.cc/1XjzvC6h/78.png',
    'https://i.postimg.cc/qBbgBRFC/79.png',
    'https://i.postimg.cc/1tKnrrJZ/8.png',
    'https://i.postimg.cc/rynzymHr/80.png',
    'https://i.postimg.cc/66jT63Pf/81.png',
    'https://i.postimg.cc/DfjmfZNj/82.png',
    'https://i.postimg.cc/Gh4t4R05/83.png',
    'https://i.postimg.cc/xTX8XQDQ/84.png',
    'https://i.postimg.cc/BQR6Dzsr/85.png',
    'https://i.postimg.cc/7Yj67Rww/86.png',
    'https://i.postimg.cc/HsFx5NdM/87.png',
    'https://i.postimg.cc/6pRQhhpH/88.png',
    'https://i.postimg.cc/4xt311xM/89.png',
    'https://i.postimg.cc/1tKnrrJS/9.png',
    'https://i.postimg.cc/3xpwZZxz/90.png',
    'https://i.postimg.cc/Lsp8QZJN/91.png',
    'https://i.postimg.cc/vmsZ2618/92.png',
    'https://i.postimg.cc/hGBtZ7JS/93.png',
    'https://i.postimg.cc/mry2v2M2/94.png',
    'https://i.postimg.cc/g0HkCkRy/95.png',
    'https://i.postimg.cc/hG1PkPx0/96.png',
    'https://i.postimg.cc/3wFJsJp1/97.png',
    'https://i.postimg.cc/wvxTg8cJ/98.png',
    'https://i.postimg.cc/FRFsN5g0/99.png',
    'https://i.postimg.cc/4dj1gywd/QQ20260131-175954.png',
    'https://i.postimg.cc/0jm02vHb/QQ20260131-181140.png',
    'https://i.postimg.cc/6qRf5K1T/QQ20260131-184006.png',
    'https://i.postimg.cc/wMJQTzb1/QQ20260131-184107.png',
    'https://i.postimg.cc/rsWNFTYd/QQ20260131-184502.png',
    'https://i.postimg.cc/J0J548dP/QQ20260131-190235.png',
    'https://i.postimg.cc/1X6r5SYj/QQ20260131-200219.png',
    'https://i.postimg.cc/wxsVk5TV/sheng-cheng-nu-ming-xing-tou-xiang.png'
  ],
  ancient_male: [
  'https://i.postimg.cc/v8N1sdmm/QQ20260131-183034.png',
  'https://i.postimg.cc/dQx7YK0G/QQ20260131-183620.png',
  'https://i.postimg.cc/9Xn4hjf7/QQ20260131-185605.png',
  'https://i.postimg.cc/zDcLr1fR/QQ20260131-185929.png',
  'https://i.postimg.cc/3rcyTHw0/QQ20260131-190124.png',
  'https://i.postimg.cc/7PWCkyLX/QQ20260131-200001.png',
  'https://i.postimg.cc/vHx48S1V/QQ20260131-200357.png',
  'https://i.postimg.cc/Kv31csKt/QQ20260131-200435.png',
  'https://i.postimg.cc/Kv31csKP/QQ20260131-200457.png',
  'https://i.postimg.cc/hPQX43J0/QQ20260131-201120.png',
  'https://i.postimg.cc/fTSVWg3B/QQ20260131-201838.png',
  'https://i.postimg.cc/sDGMf0Bc/QQ20260131-201855.png',
  'https://i.postimg.cc/3J0krbyf/QQ20260131-202028.png',
  'https://i.postimg.cc/BQPjZw8z/QQ20260131-202205.png',
  'https://i.postimg.cc/Dy4SfYWD/QQ20260131-202231.png',
  'https://i.postimg.cc/7YJ5PQCF/QQ20260131-202504.png',
  'https://i.postimg.cc/FskYFnd4/QQ20260131-225630.png',
  'https://i.postimg.cc/QdLHFk1L/QQ20260131-225649.png',
  'https://i.postimg.cc/8z8j7BMQ/QQ20260131-225707.png',
  'https://i.postimg.cc/x1rcXyM0/QQ20260131-225902.png',
  'https://i.postimg.cc/mgxtPNCZ/QQ20260131-225929.png',
  'https://i.postimg.cc/JzwGscZ4/QQ20260131-231119.png',
  'https://i.postimg.cc/htFfXbTG/QQ20260131-231146.png',
  'https://i.postimg.cc/L8dnJBLg/QQ20260131-231223.png',
  'https://i.postimg.cc/13xf8cwq/QQ20260131-231246.png',
  'https://i.postimg.cc/y8FWcgy6/QQ20260131-231322.png',
  'https://i.postimg.cc/x1KqMJ38/QQ20260131-231643.png',
  'https://i.postimg.cc/BnxtHLB1/QQ20260131-231713.png',
  'https://i.postimg.cc/DwqmLJPL/QQ20260131-231734.png',
  'https://i.postimg.cc/2S43hb7Q/QQ20260131-231910.png',
  'https://i.postimg.cc/CxjdkBsN/QQ20260131-231924.png',
  'https://i.postimg.cc/52wjLYS7/QQ20260131-231935.png',
  'https://i.postimg.cc/jjt2XxMH/QQ20260131-232003.png',
  'https://i.postimg.cc/25rywk0d/QQ20260131-233010.png',
  'https://i.postimg.cc/FKNzZrTp/QQ20260131-233025.png',
  'https://i.postimg.cc/KYxjNG0s/QQ20260131-233041.png',
  'https://i.postimg.cc/JhM0qrpF/QQ20260131-233109.png',
  'https://i.postimg.cc/bvprTy6p/QQ20260131-233205.png',
  'https://i.postimg.cc/wB2v4CP8/QQ20260131-233236.png',
  'https://i.postimg.cc/0NnQXT39/QQ20260131-233303.png',
  'https://i.postimg.cc/QMmtY2PV/QQ20260131-233334.png',
  'https://i.postimg.cc/SKds1B56/QQ20260131-233409.png',
  'https://i.postimg.cc/XJvvR2SC/QQ20260131-233600.png',
  'https://i.postimg.cc/V6NNx7QM/QQ20260131-233712.png',
  'https://i.postimg.cc/KzYY69Sr/QQ20260131-233749.png',
  'https://i.postimg.cc/85CC2yQm/QQ20260131-233806.png',
  'https://i.postimg.cc/2655sHRT/QQ20260131-234148.png',
  'https://i.postimg.cc/ydNNMf4v/QQ20260131-234631.png',
  'https://i.postimg.cc/wvBBCW8S/QQ20260201-022135.png',
  'https://i.postimg.cc/26X5r4rc/QQ20260201-022512.png',
  'https://i.postimg.cc/C16KSjS2/QQ20260201-022530.png',
  'https://i.postimg.cc/G2Spdkd6/QQ20260201-022549.png',
  'https://i.postimg.cc/cH5J0Qdq/QQ20260201-023629.png',
  'https://i.postimg.cc/ydrNsF74/QQ20260201-023647.png',
  'https://i.postimg.cc/85nCNhTN/QQ20260201-023701.png',
  'https://i.postimg.cc/9MNfCGcF/QQ20260201-023735.png',
  'https://i.postimg.cc/PxFqTmdJ/QQ20260201-025113.png',
  'https://i.postimg.cc/HxPLdQTj/QQ20260201-025754.png',
  'https://i.postimg.cc/J0DznGhR/QQ20260201-025901.png',
  'https://i.postimg.cc/2ybS6V5k/QQ20260201-025929.png',
  'https://i.postimg.cc/BbLn6Xvj/QQ20260201-030124.png',
  'https://i.postimg.cc/3N4xRdwp/QQ20260201-030154.png',
  'https://i.postimg.cc/Kjk8zRYr/QQ20260201-030239.png',
  'https://i.postimg.cc/GtWhsdBK/QQ20260201-030334.png',
  'https://i.postimg.cc/j2pdJtWv/QQ20260201-030615.png',
  'https://i.postimg.cc/2ys8Brq9/QQ20260201-030641.png',
  'https://i.postimg.cc/T2FPsqk3/QQ20260201-030705.png',
  'https://i.postimg.cc/wxZBrcW3/QQ20260201-030731.png',
  'https://i.postimg.cc/05FN4dtJ/QQ20260201-031141.png',
  'https://i.postimg.cc/y6tNGXf0/QQ20260201-032404.png',
  'https://i.postimg.cc/c12JzMDR/QQ20260201-032425.png',
  'https://i.postimg.cc/fWpbPjHf/QQ20260201-032457.png',
  'https://i.postimg.cc/CL8KpBtC/QQ20260201-032913.png',
  'https://i.postimg.cc/MKBGJM4t/QQ20260201-033309.png',
  'https://i.postimg.cc/wTNBYyPw/QQ20260201-033424.png',
  'https://i.postimg.cc/65ZQx2SP/QQ20260201-041043.png',
  'https://i.postimg.cc/jdfjYwmr/QQ20260201-041116.png',
  'https://i.postimg.cc/Z5h5bYzm/QQ20260201-041306.png',
  'https://i.postimg.cc/qvdvJBHh/QQ20260201-043903.png',
  'https://i.postimg.cc/PqXfD6qF/QQ20260201-044014.png',
  'https://i.postimg.cc/7LHPzBLB/QQ20260201-044041.png',
  'https://i.postimg.cc/d0sQCW0g/QQ20260201-044126.png',
  'https://i.postimg.cc/q7JBKmRR/QQ20260201-044237.png',
  'https://i.postimg.cc/zfxzFnbD/QQ20260201-044441.png',
  'https://i.postimg.cc/1zvmrpnV/QQ20260201-044507.png',
  'https://i.postimg.cc/QMf8Jp91/QQ20260201-044815.png',
  'https://i.postimg.cc/zfxzFnbk/QQ20260201-044955.png',
  'https://i.postimg.cc/QMf8Jp9b/QQ20260201-045455.png',
  'https://i.postimg.cc/cH6s9rw7/QQ20260201-045521.png',
  'https://i.postimg.cc/mDhbXtCS/QQ20260201-045627.png',
  'https://i.postimg.cc/PxNt3PYK/QQ20260201-045812.png',
  'https://i.postimg.cc/1t49Cfw7/QQ20260201-045835.png',
  'https://i.postimg.cc/mDhbXtC5/QQ20260201-050009.png',
  'https://i.postimg.cc/LXhHCnLw/QQ20260201-051652.png'
  ],
  ancient_female: [
    'https://i.postimg.cc/2yh3G1NG/QQ20260131-183450.png',
    'https://i.postimg.cc/Vvn5gJcy/QQ20260131-183646.png',
    'https://i.postimg.cc/J0ZtxsWV/QQ20260131-184147.png',
    'https://i.postimg.cc/KjB4f1y2/QQ20260131-184227.png',
    'https://i.postimg.cc/T1gh0Kvz/QQ20260131-185800.png',
    'https://i.postimg.cc/PJYNyCkX/QQ20260131-231206.png',
    'https://i.postimg.cc/D0Lm6SKw/QQ20260131-233148.png',
    'https://i.postimg.cc/wxmtgGRJ/QQ20260131-233534.png',
    'https://i.postimg.cc/bYtGpBS1/QQ20260131-234112.png',
    'https://i.postimg.cc/8k6FN0fy/QQ20260131-235134.png',
    'https://i.postimg.cc/QxZFtJcP/QQ20260131-235151.png',
    'https://i.postimg.cc/tCGsTNhQ/QQ20260131-235223.png',
    'https://i.postimg.cc/fTQVLfxM/QQ20260131-235322.png',
    'https://i.postimg.cc/021zQ0pJ/QQ20260131-235408.png',
    'https://i.postimg.cc/MK0vjfDH/QQ20260201-000351.png',
    'https://i.postimg.cc/fT7J0SKY/QQ20260201-000416.png',
    'https://i.postimg.cc/m23tF1wS/QQ20260201-000727.png',
    'https://i.postimg.cc/fT7J0SKq/QQ20260201-000800.png',
    'https://i.postimg.cc/qvkgcBbL/QQ20260201-000920.png',
    'https://i.postimg.cc/qvkgcBb1/QQ20260201-000949.png',
    'https://i.postimg.cc/QdXVgN44/QQ20260201-001108.png',
    'https://i.postimg.cc/XYVXKNHT/QQ20260201-001126.png',
    'https://i.postimg.cc/sgV1PfHR/QQ20260201-001145.png',
    'https://i.postimg.cc/rw8zGyZT/QQ20260201-001204.png',
    'https://i.postimg.cc/mgbh3ZpL/QQ20260201-001218.png',
    'https://i.postimg.cc/P52JSG0j/QQ20260201-001234.png',
    'https://i.postimg.cc/t42JB08R/QQ20260201-001258.png',
    'https://i.postimg.cc/DwB0xVRX/QQ20260201-001320.png',
    'https://i.postimg.cc/7Lh6csy5/QQ20260201-001523.png',
    'https://i.postimg.cc/HLnxKZC0/QQ20260201-001546.png',
    'https://i.postimg.cc/YS09Vnwd/QQ20260201-001709.png',
    'https://i.postimg.cc/q7FRdskD/QQ20260201-001726.png',
    'https://i.postimg.cc/1zdtZGmh/QQ20260201-001744.png',
    'https://i.postimg.cc/6QP3NrWq/QQ20260201-001847.png',
    'https://i.postimg.cc/V6bNsJvz/QQ20260201-001909.png',
    'https://i.postimg.cc/FRJKFYzF/QQ20260201-001936.png',
    'https://i.postimg.cc/50Ft9Xyy/QQ20260201-002029.png',
    'https://i.postimg.cc/vB6m84T1/QQ20260201-002208.png',
    'https://i.postimg.cc/ZRyqYWny/QQ20260201-002226.png',
    'https://i.postimg.cc/ZRyqYWnF/QQ20260201-002253.png',
    'https://i.postimg.cc/nzQLVXrk/QQ20260201-002423.png',
    'https://i.postimg.cc/MH2pnzff/QQ20260201-003846.png',
    'https://i.postimg.cc/Fz5HYhkJ/QQ20260201-003902.png',
    'https://i.postimg.cc/mkY2MK7p/QQ20260201-003949.png',
    'https://i.postimg.cc/8cRPWxLn/QQ20260201-012305.png',
    'https://i.postimg.cc/PJWrZ0ms/QQ20260201-012341.png',
    'https://i.postimg.cc/8cRPWxhC/QQ20260201-012359.png',
    'https://i.postimg.cc/h4TGHQN5/QQ20260201-012422.png',
    'https://i.postimg.cc/G3GpZTZ3/QQ20260201-012552.png',
    'https://i.postimg.cc/ncxLZcJh/QQ20260201-012632.png',
    'https://i.postimg.cc/SNGxKFSf/QQ20260201-013121.png',
    'https://i.postimg.cc/FHssdW15/QQ20260201-013150.png',
    'https://i.postimg.cc/3xSrgXD8/QQ20260201-013334.png',
    'https://i.postimg.cc/Qd4NpQWq/QQ20260201-013359.png',
    'https://i.postimg.cc/7LjxRqVd/QQ20260201-013424.png',
    'https://i.postimg.cc/vB9QFC2g/QQ20260201-013447.png',
    'https://i.postimg.cc/1XQy9ML1/QQ20260201-020623.png',
    'https://i.postimg.cc/PJQTNYjp/QQ20260201-020647.png',
    'https://i.postimg.cc/9XdWx5qg/QQ20260201-020704.png',
    'https://i.postimg.cc/sfYVndhg/QQ20260201-020722.png',
    'https://i.postimg.cc/ncnngR4K/QQ20260201-020856.png',
    'https://i.postimg.cc/wTF9pXF8/QQ20260201-021047.png',
    'https://i.postimg.cc/Yq8tH68w/QQ20260201-021107.png',
    'https://i.postimg.cc/bwB8GqKv/QQ20260201-021126.png',
    'https://i.postimg.cc/PqvHYBjz/QQ20260201-021825.png',
    'https://i.postimg.cc/W4qVgQV2/QQ20260201-021843.png',
    'https://i.postimg.cc/KzX2NJc2/QQ20260201-022021.png',
    'https://i.postimg.cc/DZqKYLm8/QQ20260201-022042.png',
    'https://i.postimg.cc/cHQN5w6R/QQ20260201-024609.png',
    'https://i.postimg.cc/qR8dZyg5/QQ20260201-024636.png',
    'https://i.postimg.cc/kGqdrGtZ/QQ20260201-024653.png',
    'https://i.postimg.cc/nrpt8rDh/QQ20260201-024708.png',
    'https://i.postimg.cc/90bHc2dV/QQ20260201-024736.png',
    'https://i.postimg.cc/bNYj3GPD/QQ20260201-024755.png',
    'https://i.postimg.cc/YqXBVp2n/QQ20260201-024927.png',
    'https://i.postimg.cc/cLrGGVrd/QQ20260201-030010.png',
    'https://i.postimg.cc/2SMRk2ZB/QQ20260201-030039.png',
    'https://i.postimg.cc/tg60YW32/QQ20260201-030404.png',
    'https://i.postimg.cc/cJ3qrw7S/QQ20260201-030431.png',
    'https://i.postimg.cc/wvYCJMF6/QQ20260201-030452.png',
    'https://i.postimg.cc/4dRDtywp/QQ20260201-033632.png',
    'https://i.postimg.cc/SsLwG4tV/QQ20260201-033958.png',
    'https://i.postimg.cc/vB7pvyNd/QQ20260201-034144.png',
    'https://i.postimg.cc/x80BxZwS/QQ20260201-034245.png',
    'https://i.postimg.cc/wM6nfrCy/QQ20260201-034327.png',
    'https://i.postimg.cc/NFpSW4tX/QQ20260201-034523.png',
    'https://i.postimg.cc/660k29Z6/QQ20260201-035845.png',
    'https://i.postimg.cc/kMc06nSF/QQ20260201-040342.png',
    'https://i.postimg.cc/FsH202b0/QQ20260201-040643.png',
    'https://i.postimg.cc/CLxWbWCP/QQ20260201-042944.png',
    'https://i.postimg.cc/yY8w0wXq/QQ20260201-043719.png',
    'https://i.postimg.cc/WbYx8XSx/QQ20260201-043748.png',
    'https://i.postimg.cc/c4kPhXXd/QQ20260201-045035.png',
    'https://i.postimg.cc/WbYx8XXh/QQ20260201-045114.png',
    'https://i.postimg.cc/jSWmFPFC/QQ20260201-045331.png',
    'https://i.postimg.cc/T3yF4g4n/QQ20260201-050142.png',
    'https://i.postimg.cc/QdBwy1yS/QQ20260201-050206.png',
    'https://i.postimg.cc/3xPV5Nsn/QQ20260201-051039.png',
    'https://i.postimg.cc/XYTmSXM0/QQ20260201-051105.png',
    'https://i.postimg.cc/zG96Z3mN/QQ20260201-051140.png',
    'https://i.postimg.cc/DzLD2FhN/QQ20260201-051159.png',
    'https://i.postimg.cc/XvdhV3Wt/QQ20260201-051219.png'
  ]
};

    // ==================== NPC 完整交互模态框 ====================
    window.openNpcInteractiveDetails = function(idx) {
        const npc = window.gameState?.npcs?.[idx];
        if (!npc) return;
        window.DB.activeNpcIntIdx = idx;
        // 构建模态框 HTML（基于原 game.js 中的结构）
        const modalHtml = `
            <div id="modal-npc-interactive" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:420px;">
                    <div class="h-36 relative flex items-end px-4 py-3 bg-cover bg-center" style="background-color:var(--bg-tertiary);">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
                        <div class="flex gap-3 items-center z-10">
                            <div id="npc-int-avatar-frame" class="w-14 h-14 rounded-xl overflow-hidden border flex-shrink-0" style="background:var(--bg-tertiary);border-color:var(--border-color);">
                                <img id="npc-int-avatar" class="w-full h-full object-cover hidden"><div id="npc-int-avatar-placeholder" class="w-full h-full flex items-center justify-center"><i class="fas fa-user-astronaut text-xl"></i></div>
                            </div>
                            <div class="min-w-0"><h4 id="npc-int-name" class="text-base font-black text-white truncate">${window.escapeHtml(npc.name)}</h4><p id="npc-int-relation" class="text-[10px] border px-1.5 py-0.5 rounded w-max truncate mt-0.5">${window.escapeHtml(npc.relation)}</p></div>
                        </div>
                    </div>
                    <div class="p-4 overflow-y-auto max-h-[60vh] space-y-4 text-xs">
                        <div class="border rounded-xl p-3 space-y-2"><span class="text-[10px] font-bold uppercase block">人物全览</span><div id="npc-int-jcl-info" class="grid grid-cols-2 gap-x-3 gap-y-1.5"></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">履历日志</span><button onclick="autoGenerateNpcLifeLog()" class="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded">AI生成</button><button onclick="addNpcResumeLog()" class="text-[10px] hover:underline">录入</button></div><div id="npc-int-resume-log" class="max-h-24 overflow-y-auto space-y-1 text-[11px]"></div></div>
                        <div class="grid grid-cols-2 gap-2" id="npc-int-stats-grid"></div>
                        <div id="npc-int-custom-stats-grid" class="grid grid-cols-2 gap-2"></div>
                        <div class="border rounded-xl p-3 space-y-2"><span class="font-bold text-[10px] uppercase">🔒 私人状态</span><div id="npc-int-private-info" class="grid grid-cols-2 gap-2"><span>处男/处女: <span id="npc-int-virginity">—</span></span><span>性取向: <span id="npc-int-orientation">—</span></span></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><span class="font-bold text-[10px] uppercase">🔍 隐藏信息</span><div><p><span class="secret-likes-tag">秘密</span> <span id="npc-int-secret">尚未发现</span></p><p><span class="secret-likes-tag">喜好</span> <span id="npc-int-likes">未知</span></p></div><button onclick="attemptUnlockSecret()" class="w-full border text-[10px] py-1 rounded">尝试解锁秘密</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">背包系统</span></div><button onclick="openNPCBackpackModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">打开背包查看物品详情</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">交互标签</span><button onclick="aiGenerateInteractions()" class="text-[10px] border px-2 py-0.5 rounded">AI生成交互</button></div><div id="npc-interaction-tags" class="flex flex-wrap gap-2"></div><div class="flex gap-2 mt-2"><input type="text" id="new-interaction-input" class="flex-1 border rounded px-2 py-1 text-xs" placeholder="自定义交互动作..."><button onclick="addCustomInteraction()" class="border text-xs px-2 py-1 rounded">添加</button></div></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">关系圈</span></div><button onclick="openNpcRelationsModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">查看关系圈</button></div>
                        <div class="border rounded-xl p-3 space-y-2"><div class="flex justify-between"><span class="font-bold text-[10px] uppercase">私聊视界</span></div><button onclick="openNpcWechatChatModal(window.DB.activeNpcIntIdx)" class="w-full border text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">进入微信式私聊面板</button></div>
                        <div class="space-y-1.5"><span class="block font-bold text-[10px] uppercase">快速对话（AI即时反应）</span><div id="npc-int-chat-terminal" class="border rounded-xl p-3 max-h-24 overflow-y-auto space-y-2 text-[11px]"></div></div>
                    </div>
                    <div class="p-3 border-t space-y-2"><div class="flex items-center gap-1.5 rounded-xl p-1 border"><input type="text" id="npc-int-custom-talk" class="flex-1 bg-transparent text-xs focus:outline-none px-2 py-1" placeholder="说点什么..."><button onclick="submitNpcDirectTalk()" class="border text-xs px-2.5 py-1 rounded-lg">谈话</button></div><button onclick="closeNpcInteractiveModal()" class="w-full border text-xs py-1.5 rounded-lg">退出互动</button></div>
                </div>
            </div>
        `;
        // 移除旧模态框并插入新内容
        const oldModal = document.getElementById('modal-npc-interactive');
        if (oldModal) oldModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        // 填充数据
        fillNpcInteractiveData(npc);
        // 绑定事件
        bindNpcInteractiveEvents(npc, idx);
    };

    function fillNpcInteractiveData(npc) {
        const jcl = npc.jcl || window.JUNCHENGLU_NPC_DEFAULTS;
        document.getElementById('npc-int-name').innerText = npc.name;
        document.getElementById('npc-int-relation').innerText = `纽带：${npc.relation}`;
        if (npc.portrait) {
            document.getElementById('npc-int-avatar').src = npc.portrait;
            document.getElementById('npc-int-avatar').classList.remove('hidden');
            document.getElementById('npc-int-avatar-placeholder').classList.add('hidden');
        }
        // 填充人物信息
        const infoDiv = document.getElementById('npc-int-jcl-info');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <div>年龄: ${jcl.age}</div><div>性别: ${jcl.gender}</div>
                <div>身份: ${jcl.title}</div><div>派系: ${jcl.faction}</div>
                <div class="col-span-2">性格: ${jcl.personality}</div>
                <div class="col-span-2">角色设定: ${jcl.characterSetting || '无'}</div>
                <div class="col-span-2">背景: ${jcl.background}</div>
                <div>喜好: ${jcl.likes}</div><div>忌讳: ${jcl.dislikes}</div>
                <div>技能: ${jcl.specialSkill}</div><div>健康: ${jcl.healthStatus}</div>
                <div class="col-span-2">所在地: ${window.getLocationById?.(jcl.location)?.name || '行踪不明'}</div>
                <div class="col-span-2">对玩家称呼: ${jcl.playerCallName || '你'}</div>
            `;
        }
        document.getElementById('npc-int-virginity').innerText = jcl.virginity || '—';
        document.getElementById('npc-int-orientation').innerText = jcl.orientation || '—';
        document.getElementById('npc-int-secret').innerText = npc.isSecretUnlocked ? (jcl.secret || '???') : '尚未发现';
        document.getElementById('npc-int-likes').innerText = npc.isSecretUnlocked ? (jcl.likes || '???') : '未知';
        // 履历日志
        const resumeDiv = document.getElementById('npc-int-resume-log');
        if (resumeDiv) resumeDiv.innerHTML = (jcl.resumeLog || []).map(l => `<div><span class="font-bold">${l.time}</span> ${l.event}</div>`).join('');
        // 属性网格
        const statsGrid = document.getElementById('npc-int-stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = '';
            Object.keys(npc.stats || {}).forEach(k => {
                const val = npc.stats[k];
                statsGrid.innerHTML += `<div class="border p-2 rounded flex justify-between items-center"><span>${k}</span><span class="font-bold">${val}</span><button onclick="adjustNpcStat(window.DB.activeNpcIntIdx,'${k}',-5)" class="border px-1">-5</button><button onclick="adjustNpcStat(window.DB.activeNpcIntIdx,'${k}',5)" class="border px-1">+5</button></div>`;
            });
            statsGrid.innerHTML += `<button onclick="addNpcStatManual(window.DB.activeNpcIntIdx)" class="col-span-2 border text-[10px] py-1 rounded">+ 添加属性</button>`;
        }
        // 自定义属性
        const customGrid = document.getElementById('npc-int-custom-stats-grid');
        if (customGrid) {
            customGrid.innerHTML = '';
            const custom = npc.jcl?.customStats || npc.customStats || {};
            Object.keys(custom).forEach(k => {
                customGrid.innerHTML += `<div class="border p-2 rounded"><span>${k}:</span> ${custom[k]}</div>`;
            });
        }
        // 交互标签
        renderInteractionTags(window.DB.activeNpcIntIdx);
    }

    function renderInteractionTags(idx) {
        const container = document.getElementById('npc-interaction-tags');
        if (!container) return;
        const npc = window.gameState.npcs[idx];
        const tags = window.DB.interactionTags?.[npc.id] || ['交谈', '询问', '观察', '赠送礼物', '挑衅'];
        container.innerHTML = '';
        tags.forEach(tag => {
            const chip = document.createElement('span');
            chip.className = 'interaction-tag inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-xs cursor-pointer';
            chip.innerHTML = `${tag} <i class="fas fa-times text-[10px] ml-1" onclick="event.stopPropagation();removeInteractionTag('${npc.id}','${tag}')"></i>`;
            chip.onclick = (e) => { if (!e.target.classList.contains('fa-times')) executeInteractionTag(npc, tag); };
            container.appendChild(chip);
        });
    }

    window.executeInteractionTag = async function(npc, tag) {
        const terminal = document.getElementById('npc-int-chat-terminal');
        terminal.innerHTML = '<div class="text-xs italic">AI正在反应...</div>';
        const prompt = `玩家对NPC「${npc.name}」(关系:${npc.relation})采取了行动：【${tag}】。请用中文描写一段即时反馈叙事，100字内。`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是剧情结算器");
            terminal.innerHTML = `<div class="text-xs">【${tag}】：${res}</div>`;
        } catch(e) { terminal.innerHTML = '<div class="text-xs text-red-400">动作计算中断。</div>'; }
    };

    window.addCustomInteraction = function() {
        const input = document.getElementById('new-interaction-input');
        const tag = input.value.trim();
        if (!tag || window.DB.activeNpcIntIdx === null) return;
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!window.DB.interactionTags) window.DB.interactionTags = {};
        if (!window.DB.interactionTags[npc.id]) window.DB.interactionTags[npc.id] = [];
        if (!window.DB.interactionTags[npc.id].includes(tag)) {
            window.DB.interactionTags[npc.id].push(tag);
            input.value = '';
            renderInteractionTags(window.DB.activeNpcIntIdx);
            if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        }
    };

    window.aiGenerateInteractions = async function() {
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!npc) return;
        const prompt = `请根据NPC「${npc.name}」的性格和关系，生成5个具体的交互选项（如'赠送礼物'、'挑衅'等）。输出JSON：{"interactions":["选项1","选项2","选项3","选项4","选项5"]}`;
        try {
            const res = await window.callLLMRequest?.(prompt, "你是交互选项生成器");
            const parsed = JSON.parse(window.cleanAiJsonOutput?.(res) || res);
            if (parsed.interactions) {
                if (!window.DB.interactionTags) window.DB.interactionTags = {};
                window.DB.interactionTags[npc.id] = parsed.interactions;
                renderInteractionTags(window.DB.activeNpcIntIdx);
                if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
            }
        } catch(e) { window.showToast?.("AI生成交互失败", false); }
    };

    window.closeNpcInteractiveModal = function() {
        const modal = document.getElementById('modal-npc-interactive');
        if (modal) modal.remove();
        window.DB.activeNpcIntIdx = null;
    };

    // ==================== NPC 私聊微信风格 ====================
    window.openNpcWechatChatModal = function(idx) {
        const npc = window.gameState.npcs[idx];
        if (!npc) return;
        const modalHtml = `
            <div id="modal-npc-wechat-chat" class="wechat-chat-overlay" style="display:flex;">
                <div class="wechat-chat-card">
                    <div class="wechat-chat-header"><button onclick="closeNpcWechatChatModal()" class="w-7 h-7 rounded-full flex items-center justify-center border"><i class="fas fa-arrow-left"></i></button><div class="w-9 h-9 rounded-full overflow-hidden border" id="wc-avatar-container"><img id="wc-npc-avatar" class="w-full h-full object-cover hidden"><i id="wc-npc-avatar-placeholder" class="fas fa-user-astronaut text-sm flex items-center justify-center w-full h-full"></i></div><div><h4 id="wc-npc-name" class="text-sm font-bold">${npc.name}</h4><p id="wc-npc-relation-tag" class="text-[10px]">${npc.relation}</p></div></div>
                    <div class="wechat-chat-body" id="wc-chat-messages"></div>
                    <div class="wechat-chat-footer"><input type="text" id="wc-chat-input" class="flex-1 border rounded-full px-4 py-2 text-xs" placeholder="输入消息..." onkeydown="if(event.key==='Enter')submitWechatChatMessage()"><button onclick="submitWechatChatMessage()" class="w-9 h-9 rounded-full flex items-center justify-center border"><i class="fas fa-paper-plane"></i></button></div>
                </div>
            </div>
        `;
        const old = document.getElementById('modal-npc-wechat-chat');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (npc.portrait) {
            document.getElementById('wc-npc-avatar').src = npc.portrait;
            document.getElementById('wc-npc-avatar').classList.remove('hidden');
            document.getElementById('wc-npc-avatar-placeholder').classList.add('hidden');
        }
        // 加载聊天历史
        const chatKey = npc.id;
        if (!window.DB.wechatChatHistory) window.DB.wechatChatHistory = {};
        if (!window.DB.wechatChatHistory[chatKey]) window.DB.wechatChatHistory[chatKey] = [];
        const messagesDiv = document.getElementById('wc-chat-messages');
        messagesDiv.innerHTML = '';
        window.DB.wechatChatHistory[chatKey].forEach(msg => {
            const bubble = document.createElement('div');
            bubble.className = `wechat-bubble ${msg.from==='self'?'self-bub':'npc-bub'}`;
            bubble.innerText = msg.text;
            messagesDiv.appendChild(bubble);
        });
        if (!window.DB.wechatChatHistory[chatKey].length) {
            const greet = document.createElement('div');
            greet.className = 'wechat-bubble npc-bub';
            greet.innerText = `你好，我是${npc.name}。`;
            messagesDiv.appendChild(greet);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: greet.innerText });
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    window.submitWechatChatMessage = async function() {
        const input = document.getElementById('wc-chat-input');
        const text = input.value.trim();
        if (!text || window.DB.activeNpcIntIdx === null) return;
        input.value = '';
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        const chatKey = npc.id;
        if (!window.DB.wechatChatHistory[chatKey]) window.DB.wechatChatHistory[chatKey] = [];
        const messagesDiv = document.getElementById('wc-chat-messages');
        const selfBub = document.createElement('div');
        selfBub.className = 'wechat-bubble self-bub';
        selfBub.innerText = text;
        messagesDiv.appendChild(selfBub);
        window.DB.wechatChatHistory[chatKey].push({ from:'self', text });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        const prompt = `你是NPC「${npc.name}」(性格:${npc.jcl?.personality}，关系:${npc.relation})。玩家对你说："${text}"。请用中文回复，50-150字。只输出回复文本。`;
        try {
            const reaction = await window.callLLMRequest?.(prompt, "你是NPC人格拟真模块");
            const npcBub = document.createElement('div');
            npcBub.className = 'wechat-bubble npc-bub';
            npcBub.innerText = reaction.trim();
            messagesDiv.appendChild(npcBub);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: reaction.trim() });
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } catch(e) {
            const errBub = document.createElement('div');
            errBub.className = 'wechat-bubble npc-bub';
            errBub.innerText = '...（对方暂时无法回应）';
            messagesDiv.appendChild(errBub);
            window.DB.wechatChatHistory[chatKey].push({ from:'npc', text: errBub.innerText });
        }
    };

    window.closeNpcWechatChatModal = function() {
        const modal = document.getElementById('modal-npc-wechat-chat');
        if (modal) modal.remove();
    };

    // ==================== 关系网图形化 ====================
    window.openRelationshipNetworkForNPC = function(id) {
        // 简化版，实际可调用之前的关系网弹窗
        window.openRelationshipNetworkForPlayer?.(); // 复用
    };

    // ==================== 易次元地图高级DIY ====================
    // 已在 systems.js 中实现 renderYiCiYuanMap，现补充拖拽和地点详情弹窗
    window.toggleMapDragMode = function() {
        const isActive = window.isMapDragModeActive = !window.isMapDragModeActive;
        const btn = document.getElementById('btn-map-drag-mode');
        if (btn) btn.innerText = isActive ? '退出拖拽模式' : '开启点位拖拽';
        const nodes = document.querySelectorAll('#yiciyuan-locations-layer .map-marker-dot');
        nodes.forEach(node => {
            if (isActive) {
                node.draggable = true;
                node.ondragend = (e) => {
                    const rect = node.parentElement.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    node.style.left = `${Math.min(95, Math.max(5, x))}%`;
                    node.style.top = `${Math.min(95, Math.max(5, y))}%`;
                    // 保存位置
                    const locId = node.getAttribute('data-loc-id');
                    if (!window.DB.diySettings.mapConfig.locationsPosition) window.DB.diySettings.mapConfig.locationsPosition = {};
                    window.DB.diySettings.mapConfig.locationsPosition[locId] = { x: parseFloat(node.style.left), y: parseFloat(node.style.top) };
                    if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
                };
            } else {
                node.draggable = false;
                node.ondragend = null;
            }
        });
    };

    // ==================== 论坛完整功能（评论、点赞、NPC自动回复） ====================
    window.openForumPostDetail = function(postId) {
        const post = window.forumPosts?.find(p => p.id === postId);
        if (!post) return;
        const modalHtml = `
            <div id="forum-detail-modal" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:500px;">
                    <div class="p-4 border-b flex justify-between items-center"><h3>${window.escapeHtml(post.author)} 的帖子</h3><button onclick="closeForumDetailModal()">✕</button></div>
                    <div class="p-4"><p>${window.escapeHtml(post.content)}</p><div class="text-xs text-gray-500 mt-2">${new Date(post.time).toLocaleString()}</div></div>
                    <div class="p-4 border-t"><div class="flex gap-4"><button onclick="forumLikePost(${post.id})"><i class="fas fa-heart"></i> 点赞 (${post.likes})</button><button onclick="scrollToCommentInput()"><i class="fas fa-comment"></i> 评论</button></div></div>
                    <div class="p-4 border-t"><h4>评论</h4><div id="forum-comments-list">${(post.comments || []).map(c => `<div class="border-b py-2"><span class="font-bold">${c.author}</span>: ${c.content}<div class="text-[10px] text-gray-400">${new Date(c.time).toLocaleString()}</div></div>`).join('')}</div><div class="mt-2 flex"><input type="text" id="forum-comment-input" placeholder="写评论..." class="flex-1 border rounded-full px-3 py-1"><button onclick="addCommentToPost(${post.id})" class="ml-2 px-3 py-1 bg-primary text-white rounded-full">发送</button></div></div>
                </div>
            </div>
        `;
        const old = document.getElementById('forum-detail-modal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.forumLikePost = function(postId) {
        const post = window.forumPosts?.find(p => p.id === postId);
        if (post) { post.likes++; window.saveForumData?.(); window.renderForumPosts?.(); }
    };

    window.addCommentToPost = async function(postId) {
        const input = document.getElementById('forum-comment-input');
        const content = input.value.trim();
        if (!content) return;
        const post = window.forumPosts?.find(p => p.id === postId);
        if (post) {
            if (!post.comments) post.comments = [];
            post.comments.push({ author: window.gameState?.player?.name || '匿名', content, time: Date.now() });
            window.saveForumData?.();
            window.renderForumPosts?.();
            openForumPostDetail(postId);
            input.value = '';
            // NPC 自动回复（随机）
            const npcs = window.gameState?.npcs || [];
            if (npcs.length && Math.random() < 0.3) {
                const randomNpc = npcs[Math.floor(Math.random() * npcs.length)];
                const reply = await window.callLLMRequest?.(`你是${randomNpc.name}，回复玩家评论：「${content}」，20字内。`, "简短回复");
                if (reply) {
                    post.comments.push({ author: randomNpc.name, content: reply.trim(), time: Date.now() });
                    window.saveForumData?.();
                    openForumPostDetail(postId);
                }
            }
        }
    };

    window.closeForumDetailModal = function() {
        const modal = document.getElementById('forum-detail-modal');
        if (modal) modal.remove();
    };
    window.scrollToCommentInput = function() { document.getElementById('forum-comment-input')?.focus(); };

    // ==================== 记忆视图完整编辑 ====================
    window.openMemoryView = function() {
        const mem = window.gameState?.memory || {};
        const modalHtml = `
            <div id="modal-memory-view" class="modal-overlay" style="display:flex;">
                <div class="modal-card" style="max-width:450px;">
                    <div class="p-4 border-b flex justify-between"><h3>剧情记忆</h3><button onclick="closeMemoryView()">✕</button></div>
                    <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div><div class="font-bold">世界观核心</div><textarea id="memory-world-core" rows="3" class="w-full border rounded">${mem.world_core || ''}</textarea><button onclick="saveMemoryItem('world_core')" class="mt-1 text-xs">保存</button></div>
                        <div><div class="font-bold">主线摘要</div><textarea id="memory-history-summary" rows="5" class="w-full border rounded">${mem.history_summary || ''}</textarea><button onclick="saveMemoryItem('history_summary')" class="mt-1 text-xs">保存</button></div>
                        <div><div class="font-bold">重要事件</div><textarea id="memory-key-events" rows="4" class="w-full border rounded">${(mem.key_events || []).join('\n')}</textarea><button onclick="saveMemoryItem('key_events')" class="mt-1 text-xs">保存</button></div>
                        <div><div class="font-bold">人物关系</div><textarea id="memory-relations" rows="4" class="w-full border rounded">${(mem.relations || []).join('\n')}</textarea><button onclick="saveMemoryItem('relations')" class="mt-1 text-xs">保存</button></div>
                        <div><div class="font-bold">任务进展</div><textarea id="memory-tasks" rows="3" class="w-full border rounded">${mem.tasks || ''}</textarea><button onclick="saveMemoryItem('tasks')" class="mt-1 text-xs">保存</button></div>
                    </div>
                </div>
            </div>
        `;
        const old = document.getElementById('modal-memory-view');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    };

    window.saveMemoryItem = function(field) {
        const mem = window.gameState.memory;
        if (!mem) return;
        if (field === 'world_core') mem.world_core = document.getElementById('memory-world-core').value;
        else if (field === 'history_summary') mem.history_summary = document.getElementById('memory-history-summary').value;
        else if (field === 'key_events') mem.key_events = document.getElementById('memory-key-events').value.split('\n').filter(l => l.trim());
        else if (field === 'relations') mem.relations = document.getElementById('memory-relations').value.split('\n').filter(l => l.trim());
        else if (field === 'tasks') mem.tasks = document.getElementById('memory-tasks').value;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.showToast?.("记忆已保存");
    };

    window.closeMemoryView = function() {
        const modal = document.getElementById('modal-memory-view');
        if (modal) modal.remove();
    };

    // ==================== 其他辅助函数 ====================
    window.adjustNpcStat = function(idx, key, delta) {
        const npc = window.gameState.npcs[idx];
        if (npc.stats[key] !== undefined) npc.stats[key] += delta;
        else npc.stats[key] = 50 + delta;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        if (window.DB.activeNpcIntIdx === idx) window.openNpcInteractiveDetails(idx);
    };

    window.addNpcStatManual = function(idx) {
        const key = prompt("请输入新属性名：");
        if (!key) return;
        const val = parseInt(prompt("初始值：", "50")) || 50;
        window.gameState.npcs[idx].stats[key] = val;
        if (typeof window.autoSaveGameState === 'function') window.autoSaveGameState();
        window.openNpcInteractiveDetails(idx);
    };

    window.attemptUnlockSecret = async function() {
        const npc = window.gameState.npcs[window.DB.activeNpcIntIdx];
        if (!npc) return;
        const favor = npc.stats?.['好感'] || 0;
        if (favor > 50 || Math.random() < 0.3 || window.DB.cheatModeEnabled) {
            npc.isSecretUnlocked = true;
            const prompt = `为NPC「${npc.name}」生成一个隐藏秘密（30字内）和核心喜好（30字内）。输出格式：秘密：xxx；喜好：xxx。`;
            try {
                const res = await window.callLLMRequest?.(prompt, "你是角色秘密生成器");
                const matchSecret = res.match(/秘密[：:]\s*(.+?)(?:[；;]|$)/);
                const matchLikes = res.match(/喜好[：:]\s*(.+?)$/);
                if (matchSecret) npc.jcl.secret = matchSecret[1].trim();
                if (matchLikes) npc.jcl.likes = matchLikes[1].trim();
            } catch(e) {}
            window.openNpcInteractiveDetails(window.DB.activeNpcIntIdx);
            window.showToast?.("你成功窥探到了隐藏信息！");
        } else {
            window.showToast?.("未能获取秘密，或许需要更高好感度。", false);
        }
    };

    // 挂载必要的全局变量
    window.AVATAR_LIBRARY = AVATAR_LIBRARY_FULL;
    if (!window.DB) window.DB = {};
    if (!window.DB.interactionTags) window.DB.interactionTags = {};
    if (!window.DB.wechatChatHistory) window.DB.wechatChatHistory = {};
})();
