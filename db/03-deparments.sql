DELIMITER //

DROP TABLE IF EXISTS Deparments //
CREATE TABLE Deparments (
    DeparmentID INTEGER     NOT NULL    AUTO_INCREMENT, -- Deparment's ID

    Name    VARCHAR(64)     NOT NULL,                   -- Deparment's name
	
    PRIMARY KEY (DeparmentID)
) //

INSERT INTO Deparments (Name)
VALUES ("General Inquiry"), ("Operations"), ("Finances"), ("Human Resources"), ("Information Technology"), ("Marketing");

DROP PROCEDURE IF EXISTS Deparments_Read_All //
CREATE PROCEDURE Deparments_Read_All ( )
BEGIN
    SELECT  D.*
    FROM    Deparments AS D;
END //