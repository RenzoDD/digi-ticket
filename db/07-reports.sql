DELIMITER //

DROP PROCEDURE IF EXISTS Reports_Tickets_Quantity //
CREATE PROCEDURE Reports_Tickets_Quantity ( IN SupportID INTEGER )
BEGIN
    SELECT  COUNT(T.SupportID) AS Quantity
    FROM    Tickets AS T
    WHERE   T.SupportID = SupportID;
END //

DROP PROCEDURE IF EXISTS Reports_Tickets_Open //
CREATE PROCEDURE Reports_Tickets_Open ( IN SupportID INTEGER )
BEGIN
    SELECT  COUNT(T.SupportID) AS Open
    FROM    Tickets AS T
    WHERE   T.SupportID = SupportID
            AND T.Status != 5;
END //

DROP PROCEDURE IF EXISTS Reports_Tickets_Satisfaction //
CREATE PROCEDURE Reports_Tickets_Satisfaction ( IN SupportID INTEGER )
BEGIN
    SELECT  AVG(T.Satisfaction) AS Satisfaction
    FROM    Tickets AS T
    WHERE   T.SupportID = SupportID
            AND !ISNULL(T.Satisfaction);
END //

DROP PROCEDURE IF EXISTS Reports_Tickets_Time //
CREATE PROCEDURE Reports_Tickets_Time ( IN SupportID INTEGER )
BEGIN
    SELECT  AVG(T.StatusDate - T.Creation) AS Time
    FROM    Tickets AS T
    WHERE   T.SupportID = SupportID;
END //