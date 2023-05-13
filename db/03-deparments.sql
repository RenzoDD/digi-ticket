DELIMITER //

DROP TABLE IF EXISTS Deparments //
CREATE TABLE Deparments (
    DeparmentID INTEGER     NOT NULL    AUTO_INCREMENT, -- Deparment's ID

    Name    VARCHAR(64)     NOT NULL,                   -- Deparment's name
	
    PRIMARY KEY (DeparmentID)
) //

DROP PROCEDURE IF EXISTS Deparments_Read_All //
CREATE PROCEDURE Deparments_Read_All ( )
BEGIN
    SELECT  D.*
    FROM    Deparments AS D;
END //

DROP PROCEDURE IF EXISTS Deparments_Read_DeparmentID //
CREATE PROCEDURE Deparments_Read_DeparmentID ( IN DeparmentID INTEGER )
BEGIN
    SELECT  D.*
    FROM    Deparments AS D
    WHERE   D.DeparmentID = DeparmentID;
END //