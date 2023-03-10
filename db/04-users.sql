DELIMITER //

DROP TABLE IF EXISTS Users //
CREATE TABLE Users (
    UserID      INTEGER     NOT NULL    AUTO_INCREMENT,     -- User's ID

    DeparmentID INTEGER,                                    -- User's deparment

    Type        INTEGER     NOT NULL    DEFAULT 1,          -- User's type (1-client, 2-support, 3-admin, 4-managment)
    Name        VARCHAR(64) NOT NULL,                       -- User's name
    Email       VARCHAR(64) NOT NULL    UNIQUE,             -- User's email
    Password    VARCHAR(64) NOT NULL,                       -- User's password
    Salt        VARCHAR(64) NOT NULL,                       -- Password salt
	
    PRIMARY KEY (UserID),
    FOREIGN KEY (DeparmentID) REFERENCES Deparments (DeparmentID)
) //

DROP PROCEDURE IF EXISTS Users_Create //
CREATE PROCEDURE Users_Create ( IN DeparmentID INTEGER, IN Name VARCHAR(64), IN Email VARCHAR(64), IN Password VARCHAR(64) )
BEGIN
    SET @salt = Nonce(64);
    SET @pass = SHA256(CONCAT(Password, @salt));

    INSERT INTO Users (DeparmentID, Name, Email, Password, Salt)
    VALUES (DeparmentID, Name, Email, @pass, @salt);

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
