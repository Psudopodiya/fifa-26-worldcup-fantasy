-- =============================================
-- FIFA Fantasy 2026 — Migration 003
-- Fix: wrong national_team codes on all 65
-- unsold pool players. Run this in Supabase
-- SQL Editor after 002_seed.sql.
-- =============================================

UPDATE players SET national_team = 'SEN' WHERE name = 'Nicolas Jackson'         AND team_id IS NULL;
UPDATE players SET national_team = 'MAR' WHERE name = 'Sofyan Amrabat'          AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Idrissa Gueye'           AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'Ollie Watkins'           AND team_id IS NULL;
UPDATE players SET national_team = 'COL' WHERE name = 'James Rodríguez'         AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'Marcus Rashford'         AND team_id IS NULL;
UPDATE players SET national_team = 'NOR' WHERE name = 'Sander Berge'            AND team_id IS NULL;
UPDATE players SET national_team = 'URU' WHERE name = 'Ronald Araujo'           AND team_id IS NULL;
UPDATE players SET national_team = 'BRA' WHERE name = 'Gabriel Magalhães'       AND team_id IS NULL;
UPDATE players SET national_team = 'ESP' WHERE name = 'Rodri'                   AND team_id IS NULL;
UPDATE players SET national_team = 'GER' WHERE name = 'Pascal Groß'             AND team_id IS NULL;
UPDATE players SET national_team = 'GER' WHERE name = 'Aleksandar Pavlovic'     AND team_id IS NULL;
UPDATE players SET national_team = 'ECU' WHERE name = 'Willian Pacho'           AND team_id IS NULL;
UPDATE players SET national_team = 'ESP' WHERE name = 'Aymeric Laporte'         AND team_id IS NULL;
UPDATE players SET national_team = 'GER' WHERE name = 'Antonio Rüdiger'         AND team_id IS NULL;
UPDATE players SET national_team = 'GER' WHERE name = 'Leon Goretzka'           AND team_id IS NULL;
UPDATE players SET national_team = 'MAR' WHERE name = 'Noussair Mazraoui'       AND team_id IS NULL;
UPDATE players SET national_team = 'NED' WHERE name = 'Teun Koopmeiners'        AND team_id IS NULL;
UPDATE players SET national_team = 'FRA' WHERE name = 'Marcus Thuram'           AND team_id IS NULL;
UPDATE players SET national_team = 'BRA' WHERE name = 'Fabinho'                 AND team_id IS NULL;
UPDATE players SET national_team = 'ARG' WHERE name = 'Giovani Lo Celso'        AND team_id IS NULL;
UPDATE players SET national_team = 'ESP' WHERE name = 'Alejandro Grimaldo'      AND team_id IS NULL;
UPDATE players SET national_team = 'CRO' WHERE name = 'Andrej Kramaric'         AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'Eberechi Eze'            AND team_id IS NULL;
UPDATE players SET national_team = 'CRO' WHERE name = 'Dominik Livakovic'       AND team_id IS NULL;
UPDATE players SET national_team = 'JPN' WHERE name = 'Wataru Endo'             AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'John Stones'             AND team_id IS NULL;
UPDATE players SET national_team = 'JPN' WHERE name = 'Daichi Kamada'           AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Sadio Mané'              AND team_id IS NULL;
UPDATE players SET national_team = 'CRO' WHERE name = 'Mateo Kovacic'           AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Pape Matar Sarr'         AND team_id IS NULL;
UPDATE players SET national_team = 'ECU' WHERE name = 'Pervis Estupiñán'        AND team_id IS NULL;
UPDATE players SET national_team = 'URU' WHERE name = 'Manuel Ugarte'           AND team_id IS NULL;
UPDATE players SET national_team = 'ARG' WHERE name = 'Nahuel Molina'           AND team_id IS NULL;
UPDATE players SET national_team = 'EGY' WHERE name = 'Omar Marmoush'           AND team_id IS NULL;
UPDATE players SET national_team = 'POR' WHERE name = 'Samú Costa'              AND team_id IS NULL;
UPDATE players SET national_team = 'NOR' WHERE name = 'Kristoffer Ajer'         AND team_id IS NULL;
UPDATE players SET national_team = 'URU' WHERE name = 'Giorgian de Arrascaeta'  AND team_id IS NULL;
UPDATE players SET national_team = 'NED' WHERE name = 'Memphis Depay'           AND team_id IS NULL;
UPDATE players SET national_team = 'BEL' WHERE name = 'Amadou Onana'            AND team_id IS NULL;
UPDATE players SET national_team = 'ECU' WHERE name = 'Piero Hincapié'          AND team_id IS NULL;
UPDATE players SET national_team = 'FRA' WHERE name = 'Jean-Philippe Mateta'    AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Iliman Ndiaye'           AND team_id IS NULL;
UPDATE players SET national_team = 'EGY' WHERE name = 'Mahmoud Trezeguet'       AND team_id IS NULL;
UPDATE players SET national_team = 'NOR' WHERE name = 'Martin Ødegaard'         AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'Ivan Toney'              AND team_id IS NULL;
UPDATE players SET national_team = 'POR' WHERE name = 'Rúben Dias'              AND team_id IS NULL;
UPDATE players SET national_team = 'FRA' WHERE name = 'Warren Zaïre-Emery'      AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Kalidou Koulibaly'       AND team_id IS NULL;
UPDATE players SET national_team = 'ENG' WHERE name = 'Kobbie Mainoo'           AND team_id IS NULL;
UPDATE players SET national_team = 'BRA' WHERE name = 'Gabriel Martinelli'      AND team_id IS NULL;
UPDATE players SET national_team = 'ECU' WHERE name = 'Kendry Páez'             AND team_id IS NULL;
UPDATE players SET national_team = 'ARG' WHERE name = 'Rodrigo De Paul'         AND team_id IS NULL;
UPDATE players SET national_team = 'SEN' WHERE name = 'Edouard Mendy'           AND team_id IS NULL;
UPDATE players SET national_team = 'MAR' WHERE name = 'Nayef Aguerd'            AND team_id IS NULL;
UPDATE players SET national_team = 'MAR' WHERE name = 'Bilal El Khannouss'      AND team_id IS NULL;
UPDATE players SET national_team = 'COL' WHERE name = 'Davinson Sánchez'        AND team_id IS NULL;
UPDATE players SET national_team = 'NOR' WHERE name = 'Oscar Bobb'              AND team_id IS NULL;
UPDATE players SET national_team = 'ARG' WHERE name = 'Leandro Paredes'         AND team_id IS NULL;
UPDATE players SET national_team = 'NOR' WHERE name = 'Alexander Sørloth'       AND team_id IS NULL;
UPDATE players SET national_team = 'URU' WHERE name = 'Mathías Olivera'         AND team_id IS NULL;
UPDATE players SET national_team = 'NED' WHERE name = 'Wout Weghorst'           AND team_id IS NULL;
UPDATE players SET national_team = 'FRA' WHERE name = 'Ibrahima Konaté'         AND team_id IS NULL;
UPDATE players SET national_team = 'COL' WHERE name = 'Richard Ríos'            AND team_id IS NULL;
UPDATE players SET national_team = 'FRA' WHERE name = 'Theo Hernández'          AND team_id IS NULL;

-- Verify: should return 65 rows all with correct teams
-- SELECT name, national_team FROM players WHERE team_id IS NULL ORDER BY national_team, name;
