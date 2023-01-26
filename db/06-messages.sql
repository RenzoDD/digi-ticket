DELIMITER //

DROP TABLE IF EXISTS Messages //
CREATE TABLE Messages (
    MessageID   INTEGER         NOT NULL    AUTO_INCREMENT, -- Message's ID

    TicketID    INTEGER         NOT NULL,                   -- Message's ticket
    UserID      INTEGER         NOT NULL,                   -- Message's owner
    PreviousID  INTEGER,                                    -- Previous Message

    Text        VARCHAR(2500)   NOT NULL,                   -- Message's text
    Creation    INTEGER         NOT NULL,                   -- Creation time
	
    PRIMARY KEY (MessageID),
    FOREIGN KEY (TicketID)      REFERENCES Tickets (TicketID),
    FOREIGN KEY (UserID)      REFERENCES Users (UserID),
    FOREIGN KEY (PreviousID)       REFERENCES MessageID (Messages)
) //