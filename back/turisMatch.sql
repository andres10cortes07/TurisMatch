-- Esquema TurisMatch original, conservado y adaptado para Turismo IA.
-- La vista `vista_lugares_backend` expone el formato de lectura del backend actual.

CREATE DATABASE IF NOT EXISTS `turismo_ia`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `turismo_ia`;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sitioturistico` (
  `id_sitio` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `ubicacion` varchar(255) NOT NULL,
  `ciudad` varchar(100) NOT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `horario` varchar(255) DEFAULT NULL,
  `id_categoria` int NOT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id_sitio`),
  KEY `fk_sitio_categoria` (`id_categoria`),
  CONSTRAINT `fk_sitio_categoria`
    FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`)
    ON UPDATE CASCADE,
  CONSTRAINT `chk_sitio_latitud`
    CHECK (`latitud` IS NULL OR (`latitud` >= -90 AND `latitud` <= 90)),
  CONSTRAINT `chk_sitio_longitud`
    CHECK (`longitud` IS NULL OR (`longitud` >= -180 AND `longitud` <= 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuario` (
  `identificacion` varchar(30) NOT NULL,
  `tipo_doc` varchar(20) NOT NULL,
  `nombres` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `rol` enum('administrador','turista') NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`identificacion`),
  UNIQUE KEY `uq_usuario_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `calificacion` (
  `id_calificacion` int NOT NULL AUTO_INCREMENT,
  `puntuacion` int NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `identificacion` varchar(30) NOT NULL,
  `id_sitio` int NOT NULL,
  PRIMARY KEY (`id_calificacion`),
  KEY `fk_calificacion_usuario` (`identificacion`),
  KEY `fk_calificacion_sitio` (`id_sitio`),
  CONSTRAINT `fk_calificacion_sitio`
    FOREIGN KEY (`id_sitio`) REFERENCES `sitioturistico` (`id_sitio`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_calificacion_usuario`
    FOREIGN KEY (`identificacion`) REFERENCES `usuario` (`identificacion`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorito` (
  `id_favorito` int NOT NULL AUTO_INCREMENT,
  `identificacion` varchar(30) NOT NULL,
  `id_sitio` int NOT NULL,
  PRIMARY KEY (`id_favorito`),
  UNIQUE KEY `uq_favorito_usuario_sitio` (`identificacion`,`id_sitio`),
  KEY `fk_favorito_sitio` (`id_sitio`),
  CONSTRAINT `fk_favorito_sitio`
    FOREIGN KEY (`id_sitio`) REFERENCES `sitioturistico` (`id_sitio`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorito_usuario`
    FOREIGN KEY (`identificacion`) REFERENCES `usuario` (`identificacion`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `plan` (
  `id_plan` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  `duracion` varchar(100) NOT NULL,
  `cupo` int DEFAULT NULL,
  `id_sitio` int NOT NULL,
  PRIMARY KEY (`id_plan`),
  KEY `fk_plan_sitio` (`id_sitio`),
  CONSTRAINT `fk_plan_sitio`
    FOREIGN KEY (`id_sitio`) REFERENCES `sitioturistico` (`id_sitio`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `preferencia` (
  `id_preferencia` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_preferencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `usuariopreferencia` (
  `identificacion` varchar(30) NOT NULL,
  `id_preferencia` int NOT NULL,
  `nivel_interes` int DEFAULT NULL,
  PRIMARY KEY (`identificacion`,`id_preferencia`),
  KEY `fk_usuario_preferencia_preferencia` (`id_preferencia`),
  CONSTRAINT `fk_usuario_preferencia_preferencia`
    FOREIGN KEY (`id_preferencia`) REFERENCES `preferencia` (`id_preferencia`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_preferencia_usuario`
    FOREIGN KEY (`identificacion`) REFERENCES `usuario` (`identificacion`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Migración compatible con bases ya creadas: agrega coordenadas solo si faltan.
SET @turismo_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'sitioturistico'
     AND COLUMN_NAME = 'latitud') = 0,
  'ALTER TABLE `sitioturistico` ADD COLUMN `latitud` DECIMAL(10,7) NULL',
  'SELECT 1'
);
PREPARE turismo_stmt FROM @turismo_sql;
EXECUTE turismo_stmt;
DEALLOCATE PREPARE turismo_stmt;

SET @turismo_sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'sitioturistico'
     AND COLUMN_NAME = 'longitud') = 0,
  'ALTER TABLE `sitioturistico` ADD COLUMN `longitud` DECIMAL(10,7) NULL',
  'SELECT 1'
);
PREPARE turismo_stmt FROM @turismo_sql;
EXECUTE turismo_stmt;
DEALLOCATE PREPARE turismo_stmt;

-- Compatibilidad de lectura con backend/src/lugares/lugar.entity.ts.
-- precio se toma del plan más económico del sitio; si no tiene planes, queda en 0.
-- calificacion es el promedio de sus calificaciones; si no tiene, queda en 0.
CREATE OR REPLACE VIEW `vista_lugares_backend` AS
SELECT
  s.`id_sitio` AS `id`,
  s.`id_categoria` AS `id_categoria`,
  s.`nombre` AS `nombre`,
  s.`descripcion` AS `descripcion`,
  s.`ciudad` AS `ciudad`,
  s.`ubicacion` AS `direccion`,
  c.`nombre` AS `categoria`,
  COALESCE(
    (SELECT MIN(p.`precio`) FROM `plan` p WHERE p.`id_sitio` = s.`id_sitio`),
    0.00
  ) AS `precio`,
  COALESCE(
    (SELECT ROUND(AVG(cal.`puntuacion`), 1)
     FROM `calificacion` cal
     WHERE cal.`id_sitio` = s.`id_sitio`),
    0.0
  ) AS `calificacion`,
  s.`latitud` AS `latitud`,
  s.`longitud` AS `longitud`,
  s.`imagen` AS `imagen_url`,
  s.`horario` AS `horario`
FROM `sitioturistico` s
LEFT JOIN `categoria` c ON c.`id_categoria` = s.`id_categoria`;
