DELIMITER //

DROP TABLE IF EXISTS Users //
CREATE TABLE Users (
    UserID          INTEGER     NOT NULL    AUTO_INCREMENT,     -- User's ID

    DeparmentID     INTEGER,                                    -- User's deparment

    Type            INTEGER     NOT NULL    DEFAULT 1,          -- User's type (1-client, 2-support, 3-admin, 4-managment)
    Name            VARCHAR(64) NOT NULL,                       -- User's name
    Email           VARCHAR(64) NOT NULL    UNIQUE,             -- User's email
    Password        VARCHAR(64) NOT NULL,                       -- User's password
    Salt            VARCHAR(64) NOT NULL,                       -- Password salt

    TelegramID      BIGINT                  UNIQUE,
	
    PRIMARY KEY (UserID),
    FOREIGN KEY (DeparmentID) REFERENCES Deparments (DeparmentID)
) //

DROP PROCEDURE IF EXISTS Users_Create //
CREATE PROCEDURE Users_Create ( IN Type INTEGER, IN DeparmentID INTEGER, IN Name VARCHAR(64), IN Email VARCHAR(64), IN Password VARCHAR(64) )
BEGIN
    SET @salt = Nonce(64);
    SET @pass = SHA256(CONCAT(Password, @salt));

    INSERT INTO Users (Type, DeparmentID, Name, Email, Password, Salt)
    VALUES (Type, DeparmentID, Name, Email, @pass, @salt);

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

DROP PROCEDURE IF EXISTS Users_Read_DeparmentID //
CREATE PROCEDURE Users_Read_DeparmentID ( IN DeparmentID INTEGER )
BEGIN
    SELECT  U.*
    FROM    Users AS U
    WHERE   U.Type != 1
            AND U.DeparmentID = DeparmentID;
END //

DROP PROCEDURE IF EXISTS Users_Read_UserID //
CREATE PROCEDURE Users_Read_UserID ( IN UserID INTEGER )
BEGIN
    SELECT  U.*
    FROM    Users AS U
    WHERE   U.UserID = UserID;
END //

DROP PROCEDURE IF EXISTS Users_Read_TelegramID //
CREATE PROCEDURE Users_Read_TelegramID ( IN TelegramID BIGINT )
BEGIN
    SELECT  U.*
    FROM    Users AS U
    WHERE   U.TelegramID = TelegramID;
END //

DROP PROCEDURE IF EXISTS Users_Update_Telegram //
CREATE PROCEDURE Users_Update_Telegram ( IN UserID INTEGER, IN TelegramID BIGINT )
BEGIN
    UPDATE  Users AS U
    SET     U.TelegramID = TelegramID
    WHERE   U.UserID = UserID;
    
    SELECT  U.*
    FROM    Users AS U
    WHERE   U.UserID = UserID;
END //

CALL Users_Create(1, null, "Renzo Diaz", "renzo@remadi.net", "1234") //
CALL Users_Create(2, 1, "John Yengle", "john@remadi.net", "password") //
CALL Users_Create(2, 2, "Carlos Colina", "carlos@remadi.net", "hola") //
CALL Users_Create(3, 1, "Andres Mares", "andres@remadi.net", "abc123") //
CALL Users_Create(3, 2, "Yadira Lopez", "yadira@remadi.net", "qwerty") //
