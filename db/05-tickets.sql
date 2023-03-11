DELIMITER //

DROP TABLE IF EXISTS Tickets //
CREATE TABLE Tickets (
    TicketID    INTEGER     NOT NULL    AUTO_INCREMENT, -- Ticket's ID

    ClientID    INTEGER     NOT NULL,                   -- Ticket's owner
    SupportID   INTEGER,                                -- Ticket's helpdesk employee

    DeparmentID INTEGER     NOT NULL,                   -- Ticket's deparment

    Subject     VARCHAR(256) NOT NULL,                  -- Ticket's title                          (by team) (by client)
    Status      INTEGER      NOT NULL   DEFAULT 1,      -- Ticket's status (1-created, 2-assigned, 3-aswered, 4-replied , 5-solved)
    LastDate    INTEGER      NOT NULL,                  -- Last update date
    Creation    INTEGER      NOT NULL,                  -- Creation time
	
    PRIMARY KEY (TicketID),
    FOREIGN KEY (ClientID)      REFERENCES Users (UserID),
    FOREIGN KEY (SupportID)     REFERENCES Users (UserID),
    FOREIGN KEY (DeparmentID)   REFERENCES Deparments (DeparmentID)
) //

DROP PROCEDURE IF EXISTS Tickets_Create //
CREATE PROCEDURE Tickets_Create ( IN ClientID INTEGER, IN DeparmentID INTEGER, IN Subject VARCHAR(256) )
BEGIN
    SET @unix = UNIX_TIMESTAMP();

    INSERT INTO Tickets (ClientID, DeparmentID, Subject, LastDate, Creation)
    VALUES (ClientID, DeparmentID, Subject, @unix, @unix);

    SELECT  T.*
    FROM    Tickets AS T
    WHERE   T.Subject = Subject
            AND T.Creation = @unix;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_ClientID //
CREATE PROCEDURE Tickets_Read_ClientID ( IN ClientID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(LastDate, "%b. %D %Y (%H:%i)") AS LastDateFormat
            , IF (T.Status = 1, "Created", IF (T.Status = 2, "Assigned", IF (T.Status = 3, "Aswered", IF (T.Status = 4, "Replied", IF (T.Status = 5, "Solved", "Error"))))) AS StatusFormat
    FROM    Tickets AS T INNER JOIN Deparments AS D ON T.DeparmentID = D.DeparmentID
    WHERE   T.ClientID = ClientID;
END //

DROP PROCEDURE IF EXISTS Tickets_Read_Unassigned_DeparmentID //
CREATE PROCEDURE Tickets_Read_Unassigned_DeparmentID ( IN DeparmentID INTEGER )
BEGIN
    SET time_zone = '-05:00';
    SELECT  T.*
            , D.Name AS DeparmentName
            , FROM_UNIXTIME(LastDate, "%b. %D %Y (%H:%i)") AS LastDateFormat
            , IF (T.Status = 1, "Created", IF (T.Status = 2, "Assigned", IF (T.Status = 3, "Aswered", IF (T.Status = 4, "Replied", IF (T.Status = 5, "Solved", "Error"))))) AS StatusFormat
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
            , FROM_UNIXTIME(LastDate, "%b. %D %Y (%H:%i)") AS LastDateFormat
            , IF (T.Status = 1, "Created", IF (T.Status = 2, "Assigned", IF (T.Status = 3, "Aswered", IF (T.Status = 4, "Replied", IF (T.Status = 5, "Solved", "Error"))))) AS StatusFormat
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
            , FROM_UNIXTIME(LastDate, "%b. %D %Y (%H:%i)") AS LastDateFormat
            , IF (T.Status = 1, "Created", IF (T.Status = 2, "Assigned", IF (T.Status = 3, "Aswered", IF (T.Status = 4, "Replied", IF (T.Status = 5, "Solved", "Error"))))) AS StatusFormat
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
    SET     T.DeparmentID = DeparmentID
    WHERE   T.TicketID = TicketID;
END //