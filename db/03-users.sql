DELIMITER //

DROP TABLE IF EXISTS Users //
CREATE TABLE Users (
    UserID      INTEGER     NOT NULL    AUTO_INCREMENT,
    Name        VARCHAR(64) NOT NULL,
    Lastname    VARCHAR(64) NOT NULL,
    Telegram    VARCHAR(64) NOT NULL    UNIQUE,
    Email       VARCHAR(64) NOT NULL    UNIQUE,
    Password    VARCHAR(64) NOT NULL,
    Salt        VARCHAR(64) NOT NULL,
	
    PRIMARY KEY (UserID)
) //

DROP PROCEDURE IF EXISTS Users_Create //
CREATE PROCEDURE Users_Create ( IN Name VARCHAR(64), IN Lastname VARCHAR(64), IN Telegram VARCHAR(64), IN Email VARCHAR(64), IN Password VARCHAR(64) )
BEGIN
    SET @salt = Nonce(64);
    SET @pass = SHA256(CONCAT(Password, @salt));

    INSERT INTO Users (Name, Lastname,Telegram, Email, Password, Salt)
    VALUES (Name, Lastname,Telegram, Email, @pass, @salt);

    SELECT  U.*
    FROM    Users AS U
    WHERE   U.Email = Email;
END //

DROP PROCEDURE IF EXISTS Users_Login //
CREATE PROCEDURE Users_Login ( IN Email VARCHAR(64), IN Password VARCHAR(64) )
BEGIN
    SELECT  U.*
    FROM    Users AS U
    WHERE   U.Email = Email
            AND U.Password = SHA256(CONCAT(Password, U.Salt));
END //
