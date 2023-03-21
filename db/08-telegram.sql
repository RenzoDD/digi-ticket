DELIMITER //

DROP TABLE IF EXISTS Telegram //
CREATE TABLE Telegram (
    TelegramID      BIGINT      NOT NULL,
    Information     TEXT        DEFAULT "{}",
    Token           VARCHAR(6),

    PRIMARY KEY (TelegramID)
) //

DROP PROCEDURE IF EXISTS Telegram_Create //
CREATE PROCEDURE Telegram_Create ( IN TelegramID BIGINT )
BEGIN
    SET @id = NULL;
    
    SELECT  T.TelegramID
    INTO    @id
    FROM    Telegram AS T
    WHERE   T.TelegramID = TelegramID;

    IF ISNULL(@id) THEN
        SET @token = Nonce(6);

        INSERT INTO Telegram (TelegramID, Token)
        VALUES (TelegramID, @token);
    END IF;

    SELECT  T.*
    FROM    Telegram AS T
    WHERE   T.TelegramID = TelegramID;
END //

DROP PROCEDURE IF EXISTS Telegram_Update_Information //
CREATE PROCEDURE Telegram_Update_Information ( IN TelegramID BIGINT, IN Information TEXT )
BEGIN
    UPDATE  Telegram AS T
    SET     T.Information = Information
    WHERE   T.TelegramID = TelegramID;
END //