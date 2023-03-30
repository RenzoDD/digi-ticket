DELIMITER //

DROP TABLE IF EXISTS Messages //
CREATE TABLE Messages (
    MessageID   INTEGER         NOT NULL    AUTO_INCREMENT, -- Message's ID

    TicketID    INTEGER         NOT NULL,                   -- Message's ticket
    UserID      INTEGER         NOT NULL,                   -- Message's owner

    Text        VARCHAR(2500)   NOT NULL,                   -- Message's text
    Creation    INTEGER         NOT NULL,                   -- Creation time
	
    PRIMARY KEY (MessageID),
    FOREIGN KEY (TicketID)      REFERENCES Tickets (TicketID),
    FOREIGN KEY (UserID)        REFERENCES Users (UserID)
) //

DROP PROCEDURE IF EXISTS Messages_Create //
CREATE PROCEDURE Messages_Create ( IN TicketID INTEGER, IN UserID INTEGER, IN Text VARCHAR(2500) )
BEGIN
    SET @unix = UNIX_TIMESTAMP();

    INSERT INTO Messages (TicketID, UserID, Text, Creation)
    VALUES (TicketID, UserID, Text, @unix);

    SELECT  M.*
    FROM    Messages AS M
    WHERE   M.TicketID = TicketID
            AND M.Creation = @unix;
END //

DROP PROCEDURE IF EXISTS Messages_Read_TicketID //
CREATE PROCEDURE Messages_Read_TicketID ( IN TicketID INTEGER )
BEGIN
    SELECT  M.*
            , FROM_UNIXTIME(Creation, "%b. %D %Y (%H:%i)") AS CreationFormat
            , U.Name AS UserName
            , U.Type AS UserType
    FROM    Messages AS M, Users as U
    WHERE   M.UserID = U.UserID 
            AND M.TicketID = TicketID
    ORDER BY M.MessageID;
END //

DROP PROCEDURE IF EXISTS Messages_Read_MessageID //
CREATE PROCEDURE Messages_Read_MessageID ( IN MessageID INTEGER )
BEGIN
    SELECT  M.*
    FROM    Messages AS M
    WHERE   M.MessageID = MessageID;
END //