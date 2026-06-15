-- =============================================
-- FIFA Fantasy 2026 — Seed Data
-- Run AFTER 001_schema.sql
-- =============================================

-- =============================================
-- NATIONAL TEAMS (WC 2026 participants)
-- =============================================
INSERT INTO national_teams (code, name, group_name, flag_emoji) VALUES
('ARG','Argentina','C','🇦🇷'),
('BRA','Brazil','E','🇧🇷'),
('FRA','France','E','🇫🇷'),
('ENG','England','F','🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
('GER','Germany','A','🇩🇪'),
('ESP','Spain','B','🇪🇸'),
('POR','Portugal','E','🇵🇹'),
('NED','Netherlands','G','🇳🇱'),
('BEL','Belgium','H','🇧🇪'),
('URU','Uruguay','F','🇺🇾'),
('MAR','Morocco','F','🇲🇦'),
('JPN','Japan','C','🇯🇵'),
('MEX','Mexico','A','🇲🇽'),
('COL','Colombia','H','🇨🇴'),
('NOR','Norway','C','🇳🇴'),
('SEN','Senegal','G','🇸🇳'),
('EGY','Egypt','A','🇪🇬'),
('ECU','Ecuador','B','🇪🇨'),
('CRO','Croatia','D','🇭🇷'),
('ARG','Argentina','C','🇦🇷')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- TOURNAMENT PHASES
-- =============================================
INSERT INTO tournament_phases (phase_id, name, round, max_players_per_nation, free_transfers_per_matchday, transfer_rollover_max, captain_twists_per_matchday, manual_subs_per_matchday, is_wildcard, is_current) VALUES
('PHASE_01','Group Stage','Group Stage (MD 1-3)',3,1,1,2,3,false,true),
('PHASE_02','Round of 32','Round of 32',NULL,NULL,NULL,NULL,NULL,true,false),
('PHASE_03','Round of 16','Round of 16',4,3,1,NULL,NULL,false,false),
('PHASE_04','Quarter-Finals','Quarter-Finals',5,4,1,NULL,NULL,false,false),
('PHASE_05','Semi-Finals','Semi-Finals',6,5,1,NULL,NULL,false,false),
('PHASE_06','Finals','Finals & 3rd Place',8,6,1,NULL,NULL,false,false);

-- =============================================
-- FANTASY TEAMS (6 teams from auction)
-- Note: user_id is NULL until you assign Supabase Auth users in admin
-- =============================================
INSERT INTO teams (id, name, budget_remaining, is_admin) VALUES
('11111111-0000-0000-0000-000000000001','Lazy Lamhe',17,false),
('11111111-0000-0000-0000-000000000002','AvD''s Team',7,false),
('11111111-0000-0000-0000-000000000003','Chilly Chole',26,false),
('11111111-0000-0000-0000-000000000004','Chole Bhature',0.5,false),
('11111111-0000-0000-0000-000000000005','Munch Parantha',12,false),
('11111111-0000-0000-0000-000000000006','Inazuma XI',10,false);

-- =============================================
-- APP SETTINGS
-- =============================================
INSERT INTO app_settings (key, value) VALUES
('clean_sheet_active','false'),
('msa_max_releases','3'),
('current_matchday','1'),
('current_phase','PHASE_01'),
('league_name','FIFA 2026 Fantasy League');

-- =============================================
-- PLAYERS — Team: Lazy Lamhe (team 1)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Nicolás Otamendi','DEF','ARG','11111111-0000-0000-0000-000000000001',6,true),
('Nuno Mendes','DEF','POR','11111111-0000-0000-0000-000000000001',18,true),
('Charles De Ketelaere','MID','BEL','11111111-0000-0000-0000-000000000001',1,true),
('Nico Williams','FWD','ESP','11111111-0000-0000-0000-000000000001',1,true),
('Bruno Guimarães','MID','BRA','11111111-0000-0000-0000-000000000001',1,true),
('Bruno Fernandes','MID','POR','11111111-0000-0000-0000-000000000001',68,true),
('Takefusa Kubo','FWD','JPN','11111111-0000-0000-0000-000000000001',5.5,true),
('Matheus Cunha','FWD','BRA','11111111-0000-0000-0000-000000000001',1,true),
('Romelu Lukaku','FWD','BEL','11111111-0000-0000-0000-000000000001',25,true),
('Tijjani Reijnders','MID','NED','11111111-0000-0000-0000-000000000001',10,true),
('Nico Schlotterbeck','DEF','GER','11111111-0000-0000-0000-000000000001',1,true),
('Diogo Costa','GK','POR','11111111-0000-0000-0000-000000000001',5,true),
('Lucas Paquetá','MID','BRA','11111111-0000-0000-0000-000000000001',3.5,true),
('Cristian Romero','DEF','ARG','11111111-0000-0000-0000-000000000001',5.5,true),
('Désiré Doué','FWD','FRA','11111111-0000-0000-0000-000000000001',11.5,true),
('William Saliba','DEF','FRA','11111111-0000-0000-0000-000000000001',1,true);

-- =============================================
-- PLAYERS — Team: AvD's Team (team 2)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Marquinhos','DEF','BRA','11111111-0000-0000-0000-000000000002',0.5,true),
('Jude Bellingham','MID','ENG','11111111-0000-0000-0000-000000000002',18,true),
('Kevin De Bruyne','MID','BEL','11111111-0000-0000-0000-000000000002',1.5,true),
('Takehiro Tomiyasu','DEF','JPN','11111111-0000-0000-0000-000000000002',0.5,true),
('Marc Guehi','DEF','ENG','11111111-0000-0000-0000-000000000002',10.5,true),
('Daniel Muñoz','DEF','COL','11111111-0000-0000-0000-000000000002',0.5,true),
('Moisés Caicedo','MID','ECU','11111111-0000-0000-0000-000000000002',2.5,true),
('N''Golo Kanté','MID','FRA','11111111-0000-0000-0000-000000000002',1,true),
('Vitinha','MID','POR','11111111-0000-0000-0000-000000000002',4,true),
('Morgan Rogers','MID','ENG','11111111-0000-0000-0000-000000000002',1,true),
('Michael Olise','FWD','FRA','11111111-0000-0000-0000-000000000002',43.5,true),
('Florian Wirtz','MID','GER','11111111-0000-0000-0000-000000000002',31.5,true),
('Joshua Kimmich','MID','GER','11111111-0000-0000-0000-000000000002',15,true),
('Mike Maignan','GK','FRA','11111111-0000-0000-0000-000000000002',17,true),
('Jonathan Tah','DEF','GER','11111111-0000-0000-0000-000000000002',3.5,true),
('Achraf Hakimi','DEF','MAR','11111111-0000-0000-0000-000000000002',0.5,true);

-- =============================================
-- PLAYERS — Team: Chilly Chole (team 3)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Nathan Aké','DEF','NED','11111111-0000-0000-0000-000000000003',0.5,true),
('Jules Koundé','DEF','FRA','11111111-0000-0000-0000-000000000003',6.5,true),
('Darwin Núñez','FWD','URU','11111111-0000-0000-0000-000000000003',0.5,true),
('Yassine Bounou','GK','MAR','11111111-0000-0000-0000-000000000003',0.5,true),
('Luis Díaz','FWD','COL','11111111-0000-0000-0000-000000000003',0.8,true),
('Kai Havertz','FWD','GER','11111111-0000-0000-0000-000000000003',6.5,true),
('Leandro Trossard','FWD','BEL','11111111-0000-0000-0000-000000000003',4,true),
('Declan Rice','MID','ENG','11111111-0000-0000-0000-000000000003',1.5,true),
('Lionel Messi','FWD','ARG','11111111-0000-0000-0000-000000000003',29.5,true),
('Gavi','MID','ESP','11111111-0000-0000-0000-000000000003',0.8,true),
('Dani Olmo','MID','ESP','11111111-0000-0000-0000-000000000003',6,true),
('Lisandro Martínez','DEF','ARG','11111111-0000-0000-0000-000000000003',0.5,true),
('Rodrigo Bentancur','MID','URU','11111111-0000-0000-0000-000000000003',1,true),
('Josko Gvardiol','DEF','CRO','11111111-0000-0000-0000-000000000003',0,true),
('Harry Kane','FWD','ENG','11111111-0000-0000-0000-000000000003',79.5,true),
('Thibaut Courtois','GK','BEL','11111111-0000-0000-0000-000000000003',11,true);

-- =============================================
-- PLAYERS — Team: Chole Bhature (team 4)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Pedro Neto','FWD','POR','11111111-0000-0000-0000-000000000004',1.5,true),
('Denzel Dumfries','DEF','NED','11111111-0000-0000-0000-000000000004',0.5,true),
('Mohamed Salah','FWD','EGY','11111111-0000-0000-0000-000000000004',4.5,true),
('Martin Zubimendi','MID','ESP','11111111-0000-0000-0000-000000000004',1,true),
('Jérémy Doku','FWD','BEL','11111111-0000-0000-0000-000000000004',5,true),
('Federico Valverde','MID','URU','11111111-0000-0000-0000-000000000004',4,true),
('Alexis Mac Allister','MID','ARG','11111111-0000-0000-0000-000000000004',4,true),
('João Neves','MID','POR','11111111-0000-0000-0000-000000000004',1.5,true),
('Ousmane Dembélé','FWD','FRA','11111111-0000-0000-0000-000000000004',63.5,true),
('Virgil van Dijk','DEF','NED','11111111-0000-0000-0000-000000000004',33.5,true),
('Reece James','DEF','ENG','11111111-0000-0000-0000-000000000004',1,true),
('Erling Haaland','FWD','NOR','11111111-0000-0000-0000-000000000004',17.5,true),
('Raphininha','FWD','BRA','11111111-0000-0000-0000-000000000004',4,true),
('Emiliano Martínez','GK','ARG','11111111-0000-0000-0000-000000000004',20,true),
('Jamal Musiala','MID','GER','11111111-0000-0000-0000-000000000004',21.5,true),
('Lautaro Martínez','FWD','ARG','11111111-0000-0000-0000-000000000004',18.5,true);

-- =============================================
-- PLAYERS — Team: Munch Parantha (team 5)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Ritsu Doan','MID','JPN','11111111-0000-0000-0000-000000000005',0.5,true),
('Casemiro','MID','BRA','11111111-0000-0000-0000-000000000005',0.5,true),
('Brahim Díaz','MID','MAR','11111111-0000-0000-0000-000000000005',2,true),
('Kylian Mbappé','FWD','FRA','11111111-0000-0000-0000-000000000005',64.5,true),
('Cody Gakpo','FWD','NED','11111111-0000-0000-0000-000000000005',3,true),
('David Raya','GK','ESP','11111111-0000-0000-0000-000000000005',0.5,true),
('Bukayo Saka','FWD','ENG','11111111-0000-0000-0000-000000000005',0.5,true),
('Cristiano Ronaldo','FWD','POR','11111111-0000-0000-0000-000000000005',34.8,true),
('Unai Simón','GK','ESP','11111111-0000-0000-0000-000000000005',0.5,true),
('Luka Modrić','MID','CRO','11111111-0000-0000-0000-000000000005',2.5,true),
('Mikel Merino','MID','ESP','11111111-0000-0000-0000-000000000005',4,true),
('Rafael Leão','FWD','POR','11111111-0000-0000-0000-000000000005',1.5,true),
('Leroy Sané','FWD','GER','11111111-0000-0000-0000-000000000005',3,true),
('Vinicius Júnior','FWD','BRA','11111111-0000-0000-0000-000000000005',29.5,true),
('Bernardo Silva','MID','POR','11111111-0000-0000-0000-000000000005',3,true),
('Neymar','FWD','BRA','11111111-0000-0000-0000-000000000005',2.5,true);

-- =============================================
-- PLAYERS — Team: Inazuma XI (team 6, 14 players - 2 slots open)
-- =============================================
INSERT INTO players (name, position, national_team, team_id, auction_price, is_sold) VALUES
('Bradley Barcola','FWD','FRA','11111111-0000-0000-0000-000000000006',0.5,true),
('Dayot Upamecano','DEF','FRA','11111111-0000-0000-0000-000000000006',10.5,true),
('Frenkie de Jong','MID','NED','11111111-0000-0000-0000-000000000006',3,true),
('Pau Cubarsi','DEF','ESP','11111111-0000-0000-0000-000000000006',1.5,true),
('Rayan Cherki','MID','FRA','11111111-0000-0000-0000-000000000006',6.5,true),
('Anthony Gordon','FWD','ENG','11111111-0000-0000-0000-000000000006',0.5,true),
('Marc Cucurella','DEF','ESP','11111111-0000-0000-0000-000000000006',7.5,true),
('Bart Verbruggen','GK','NED','11111111-0000-0000-0000-000000000006',0.5,true),
('Julián Álvarez','FWD','ARG','11111111-0000-0000-0000-000000000006',14,true),
('Aurélien Tchouaméni','MID','FRA','11111111-0000-0000-0000-000000000006',NULL,true),
('Enzo Fernández','MID','ARG','11111111-0000-0000-0000-000000000006',5.5,true),
('Lamine Yamal','FWD','ESP','11111111-0000-0000-0000-000000000006',166,true),
('Ryan Gravenberch','MID','NED','11111111-0000-0000-0000-000000000006',0.5,true),
('João Cancelo','DEF','POR','11111111-0000-0000-0000-000000000006',4.5,true);

-- =============================================
-- UNSOLD PLAYERS (pool — team_id NULL)
-- =============================================
INSERT INTO players (name, position, national_team, is_sold) VALUES
('Nicolas Jackson','FWD','SEN',false),
('Sofyan Amrabat','MID','MAR',false),
('Idrissa Gueye','MID','SEN',false),
('Ollie Watkins','FWD','ENG',false),
('James Rodríguez','MID','COL',false),
('Marcus Rashford','FWD','ENG',false),
('Sander Berge','MID','NOR',false),
('Ronald Araujo','DEF','URU',false),
('Gabriel Magalhães','DEF','BRA',false),
('Rodri','MID','ESP',false),
('Pascal Groß','MID','GER',false),
('Aleksandar Pavlovic','MID','GER',false),
('Willian Pacho','DEF','ECU',false),
('Aymeric Laporte','DEF','ESP',false),
('Antonio Rüdiger','DEF','GER',false),
('Leon Goretzka','MID','GER',false),
('Noussair Mazraoui','DEF','MAR',false),
('Teun Koopmeiners','MID','NED',false),
('Marcus Thuram','FWD','FRA',false),
('Fabinho','MID','BRA',false),
('Giovani Lo Celso','MID','ARG',false),
('Alejandro Grimaldo','DEF','ESP',false),
('Andrej Kramaric','MID','CRO',false),
('Eberechi Eze','MID','ENG',false),
('Dominik Livakovic','GK','CRO',false),
('Wataru Endo','MID','JPN',false),
('John Stones','DEF','ENG',false),
('Daichi Kamada','MID','JPN',false),
('Sadio Mané','FWD','SEN',false),
('Mateo Kovacic','MID','CRO',false),
('Pape Matar Sarr','MID','SEN',false),
('Pervis Estupiñán','DEF','ECU',false),
('Manuel Ugarte','MID','URU',false),
('Nahuel Molina','DEF','ARG',false),
('Omar Marmoush','FWD','EGY',false),
('Samú Costa','MID','POR',false),
('Kristoffer Ajer','DEF','NOR',false),
('Giorgian de Arrascaeta','MID','URU',false),
('Memphis Depay','FWD','NED',false),
('Amadou Onana','MID','BEL',false),
('Piero Hincapié','DEF','ECU',false),
('Jean-Philippe Mateta','FWD','FRA',false),
('Iliman Ndiaye','FWD','SEN',false),
('Mahmoud Trezeguet','FWD','EGY',false),
('Martin Ødegaard','MID','NOR',false),
('Ivan Toney','FWD','ENG',false),
('Rúben Dias','DEF','POR',false),
('Warren Zaïre-Emery','MID','FRA',false),
('Kalidou Koulibaly','DEF','SEN',false),
('Kobbie Mainoo','MID','ENG',false),
('Gabriel Martinelli','FWD','BRA',false),
('Kendry Páez','MID','ECU',false),
('Rodrigo De Paul','MID','ARG',false),
('Edouard Mendy','GK','SEN',false),
('Nayef Aguerd','DEF','MAR',false),
('Bilal El Khannouss','MID','MAR',false),
('Davinson Sánchez','DEF','COL',false),
('Oscar Bobb','FWD','NOR',false),
('Leandro Paredes','MID','ARG',false),
('Alexander Sørloth','FWD','NOR',false),
('Mathías Olivera','DEF','URU',false),
('Wout Weghorst','FWD','NED',false),
('Ibrahima Konaté','DEF','FRA',false),
('Richard Ríos','MID','COL',false),
('Theo Hernández','DEF','FRA',false);
