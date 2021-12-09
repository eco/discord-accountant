DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` varchar(100) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `by_id` varchar(100) DEFAULT NULL,
  `by_username` varchar(100) DEFAULT NULL,
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admins_id_uindex` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DROP TABLE IF EXISTS `points`;
CREATE TABLE `points` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `type` varchar(10) NOT NULL,
  `caller_id` varchar(100) NOT NULL,
  `caller_username` varchar(100) DEFAULT NULL,
  `from_id` varchar(100) DEFAULT NULL,
  `from_username` varchar(100) DEFAULT NULL,
  `to_id` varchar(100) NOT NULL,
  `to_username` varchar(100) DEFAULT NULL,
  `points` decimal(32,16) NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `points_id_uindex` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
