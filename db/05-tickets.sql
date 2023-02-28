DELIMITER //

DROP TABLE IF EXISTS Tickets //
CREATE TABLE Tickets (
    TicketID    INTEGER     NOT NULL    AUTO_INCREMENT, -- Ticket's ID

    ClientID    INTEGER     NOT NULL,                   -- Ticket's owner
    SuportID    INTEGER,                                -- Ticket's helpdesk employee
    AdminID     INTEGER,                                -- Ticket's helpdesk manager

    DeparmentID INTEGER     NOT NULL,                   -- Ticket's deparment

    Subject     VARCHAR(256) NOT NULL,                  -- Ticket's title                          (by team) (by client)
    Status      INTEGER      NOT NULL   DEFAULT 1,      -- Ticket's status (1-created, 2-assigned, 3-aswered, 4-replied , 5-solved)
    LastDate    INTEGER      NOT NULL,                  -- Last update date
    Creation    INTEGER      NOT NULL,                  -- Creation time
	
    PRIMARY KEY (TicketID),
    FOREIGN KEY (ClientID)      REFERENCES Users (UserID),
    FOREIGN KEY (SuportID)      REFERENCES Users (UserID),
    FOREIGN KEY (AdminID)       REFERENCES Users (UserID),
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
    SELECT  T.*
    FROM    Tickets AS T
    WHERE   T.ClientID = ClientID;
END //