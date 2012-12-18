DROP TABLE IF EXISTS `makes`;
CREATE TABLE `makes` (
  `id`            char(36)      NOT NULL,
  `version`       char(36)      NOT NULL,
  `url`           VARCHAR(2083) NOT NULL,
  `contentType`   varchar(255)  NOT NULL,
  `locale`        varchar(255)  NOT NULL,
  `title`         varchar(255)  NOT NULL,
  `description`   text,
  `author`        varchar(255),
  `contentAuthor` varchar(255),
  `published`     boolean       NOT NULL DEFAULT 1,
  `createdAt`     datetime      NOT NULL,
  `updatedAt`     datetime      NOT NULL,
  `deletedAt`     datetime,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE INDEX makes_locales_index ON makes (locale);
CREATE INDEX makes_author_index ON makes (author);
CREATE INDEX makes_contentAuthor_index ON makes (contentAuthor);
CREATE INDEX makes_contentType_index ON makes (contentType);

DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `value`     varchar(255)  NOT NULL,
  `makeId`    int(11)       NOT NULL,
  `isPublic`  boolean, 
  PRIMARY KEY (`value`, `makeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
