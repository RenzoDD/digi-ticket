DELIMITER //

DROP TABLE IF EXISTS Tickets //
CREATE TABLE Tickets (
    TicketID    INTEGER     NOT NULL    AUTO_INCREMENT, -- Ticket's ID

    ClientID    INTEGER     NOT NULL,                   -- Ticket's owner
    SuportID    INTEGER     NOT NULL,                   -- Ticket's helpdesk employee
    AdminID     INTEGER     NOT NULL,                   -- Ticket's helpdesk manager

    DeparmentID INTEGER     NOT NULL,                   -- Ticket's deparment

    Title       VARCHAR(256) NOT NULL,                  -- Ticket's title                          (by team) (by client)
    Status      INTEGER      NOT NULL   DEFAULT 1,      -- Ticket's status (1-created, 2-assigned, 3-aswered, 4-replied , 5-solved)
    Creation    INTEGER      NOT NULL,                  -- Creation time
	
    PRIMARY KEY (UserID),
    FOREIGN KEY (ClientID)      REFERENCES Users (UserID),
    FOREIGN KEY (SuportID)      REFERENCES Users (UserID),
    FOREIGN KEY (AdminID)       REFERENCES Users (UserID),
    FOREIGN KEY (DeparmentID)   REFERENCES Deparments (DeparmentID)
) //