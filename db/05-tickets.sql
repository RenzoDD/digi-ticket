DELIMITER //

DROP TABLE IF EXISTS Tickets //
CREATE TABLE Tickets (
    TicketID        INTEGER     NOT NULL    AUTO_INCREMENT, -- Ticket's ID

    ClientID        INTEGER     NOT NULL,                   -- Ticket's owner
    SupportID       INTEGER,                                -- Ticket's helpdesk employee

    DeparmentID     INTEGER     NOT NULL,                   -- Ticket's deparment

    Impact          INTEGER     NOT NULL,                   -- Impact on 
    DownTime        INTEGER     NOT NULL,                   -- Downtime of the client service (If needed)
    Priority        INTEGER     NOT NULL,                   -- Priority of the ticket acording to client

    Subject         VARCHAR(256) NOT NULL,                  -- Ticket's title                          (by team) (by client)
    Status          INTEGER      NOT NULL   DEFAULT 1,      -- Ticket's status (1-created, 2-assigned, 3-aswered, 4-replied , 5-closed)
    StatusDate      INTEGER      NOT NULL,                  -- Last update date
    Satisfaction    INTEGER,                                -- Satisfaction level
    Creation        INTEGER      NOT NULL,                  -- Creation time

    TXID            VARCHAR(64),
	
    PRIMARY KEY (TicketID),
    FOREIGN KEY (ClientID)      REFERENCES Users (UserID),
    FOREIGN KEY (SupportID)     REFERENCES Users (UserID),
    FOREIGN KEY (DeparmentID)   REFERENCES Deparments (DeparmentID)
) //

DROP PROCEDURE IF EXISTS Tickets_Create //
CREATE PROCEDURE Tickets_Create ( IN ClientID INTEGER, IN DeparmentID INTEGER, IN Impact INTEGER, IN DownTime INTEGER, IN Priority INTEGER, IN Subject VARCHAR(256) )
BEGIN
    SET @unix = UNIX_TIMESTAMP();

    INSERT INTO Tickets (ClientID, DeparmentID, Impact, DownTime, Priority, Subject, StatusDate, Creation)
    VALUES (ClientID, DeparmentID, Impact, DownTime, Priority, Subject, @unix, @unix);

    SELECT  T.*
    FROM    Tickets AS T
    WHERE   T.Subject = Subject
            AND T.Creation = @unix;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_All //
CREATE PROCEDURE Tickets_Read_All ( )
BEGIN
    SELECT  T.*
    FROM    Tickets AS T;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_Status //
CREATE PROCEDURE Tickets_Read_Status ( IN Status INTEGER )
BEGIN
    SELECT  COUNT(T.TicketID) AS Quantity
    FROM    Tickets AS T
    WHERE   T.Status = Status;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_ClientID //
CREATE PROCEDURE Tickets_Read_ClientID ( IN ClientID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(StatusDate, "%b. %D %Y (%H:%i)") AS StatusDateFormat
    FROM    Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID
    WHERE   T.ClientID = ClientID;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_SupportID //
CREATE PROCEDURE Tickets_Read_SupportID ( IN SupportID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(StatusDate, "%b. %D %Y (%H:%i)") AS StatusDateFormat
    FROM    Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID
    WHERE   T.SupportID = SupportID;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_Unassigned_DeparmentID //
CREATE PROCEDURE Tickets_Read_Unassigned_DeparmentID ( IN DeparmentID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(StatusDate, "%b. %D %Y (%H:%i)") AS StatusDateFormat
    FROM    Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID
    WHERE   ISNULL(T.SupportID)
            AND T.DeparmentID = DeparmentID;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_Assigned_DeparmentID //
CREATE PROCEDURE Tickets_Read_Assigned_DeparmentID ( IN DeparmentID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(StatusDate, "%b. %D %Y (%H:%i)") AS StatusDateFormat
    FROM    Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID
    WHERE   !ISNULL(T.SupportID)
            AND T.DeparmentID = DeparmentID;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_TicketID //
CREATE PROCEDURE Tickets_Read_TicketID ( IN TicketID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(StatusDate, "%b. %D %Y (%H:%i)") AS StatusDateFormat
            , U.Name AS SupportName
    FROM    (Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID) LEFT JOIN Users AS U ON T.SupportID = U.UserID
    WHERE   T.TicketID = TicketID;
END //

DROP PROCEDURE IF EXISTS Tickets_Update_SupportID //
CREATE PROCEDURE Tickets_Update_SupportID ( IN TicketID INTEGER, IN SupportID INTEGER )
BEGIN
    UPDATE  Tickets AS T
    SET     T.SupportID = SupportID
    WHERE   T.TicketID = TicketID;
END //

DROP PROCEDURE IF EXISTS Tickets_Update_DeparmentID //
CREATE PROCEDURE Tickets_Update_DeparmentID ( IN TicketID INTEGER, IN DeparmentID INTEGER )
BEGIN
    UPDATE  Tickets AS T
    SET     T.DeparmentID = DeparmentID, T.SupportID = NULL
    WHERE   T.TicketID = TicketID;
END //

DROP PROCEDURE IF EXISTS Tickets_Update_Status //
CREATE PROCEDURE Tickets_Update_Status ( IN TicketID INTEGER, IN Status INTEGER )
BEGIN
    SET @unix = UNIX_TIMESTAMP();

    UPDATE  Tickets AS T
    SET     T.Status = Status, T.StatusDate = @unix
    WHERE   T.TicketID = TicketID;
END //

DROP PROCEDURE IF EXISTS Tickets_Update_Satisfaction //
CREATE PROCEDURE Tickets_Update_Satisfaction ( IN TicketID INTEGER, IN Satisfaction INTEGER )
BEGIN
    SET @unix = UNIX_TIMESTAMP();

    UPDATE  Tickets AS T
    SET     T.Satisfaction = Satisfaction
    WHERE   T.TicketID = TicketID;
END //

DROP PROCEDURE IF EXISTS Tickets_Update_TXID //
CREATE PROCEDURE Tickets_Update_TXID ( IN TicketID INTEGER, IN TXID VARCHAR(64) )
BEGIN
    UPDATE  Tickets AS T
    SET     T.TXID = TXID
    WHERE   T.TicketID = TicketID;
END //