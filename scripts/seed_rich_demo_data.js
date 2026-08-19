const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: 'postgresql://seal_bl3w_db_user:EpO4IbgovuNVhaVANneraIPY7iqSHujJ@dpg-d9tstb2jobas73dpeld0-a.oregon-postgres.render.com:5432/seal_bl3w_db',
  ssl: { rejectUnauthorized: false }
});

function genId() {
  return crypto.randomUUID().replace(/-/g, '');
}

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL database for seeding demo data...');

  // 1. Fetch ALL Events
  const eventsRes = await client.query(`SELECT "Id", "EventName" FROM "Events" ORDER BY "CreatedTime" DESC;`);
  console.log(`Found ${eventsRes.rows.length} events in database.`);

  if (eventsRes.rows.length === 0) {
    console.log('No events found to seed teams for.');
    await client.end();
    return;
  }

  // 2. Fetch Schools
  const schoolsRes = await client.query(`SELECT "Id", "SchoolName" FROM "Schools" LIMIT 10;`);
  const schoolIds = schoolsRes.rows.map(s => s.Id);
  const defaultSchoolId = schoolIds[0] || null;

  // 3. Prepare Candidate Users
  const candidateUsers = [
    { name: 'Nguyễn Hoàng Nam', email: 'nam.nh.candidate@seal.edu.vn', code: 'SE170123' },
    { name: 'Trần Minh Quang', email: 'quang.tm.candidate@seal.edu.vn', code: 'SE170456' },
    { name: 'Lê Thảo Vy', email: 'vy.lt.candidate@seal.edu.vn', code: 'SE170789' },
    { name: 'Phạm Đức Anh', email: 'anh.pd.candidate@seal.edu.vn', code: 'SE180012' },
    { name: 'Võ Mai Linh', email: 'linh.vm.candidate@seal.edu.vn', code: 'SE180345' },
    { name: 'Đặng Quốc Bảo', email: 'bao.dq.candidate@seal.edu.vn', code: 'SE180678' },
    { name: 'Hoàng Kim Ngân', email: 'ngan.hk.candidate@seal.edu.vn', code: 'SE180901' },
    { name: 'Bùi Gia Huy', email: 'huy.bg.candidate@seal.edu.vn', code: 'SE190111' },
    { name: 'Huỳnh Khánh Duy', email: 'duy.hk.candidate@seal.edu.vn', code: 'SE190222' },
    { name: 'Phan Yến Nhi', email: 'nhi.py.candidate@seal.edu.vn', code: 'SE190333' },
    { name: 'Đỗ Tuấn Kiệt', email: 'kiet.dt.candidate@seal.edu.vn', code: 'SE190444' },
    { name: 'Ngô Thanh Trúc', email: 'truc.nt.candidate@seal.edu.vn', code: 'SE190555' },
  ];

  const dbUserIds = [];
  for (let i = 0; i < candidateUsers.length; i++) {
    const u = candidateUsers[i];
    const existing = await client.query(`SELECT "Id" FROM "Users" WHERE "Email" = $1;`, [u.email]);
    let userId;
    const userSchoolId = schoolIds[i % schoolIds.length] || defaultSchoolId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].Id;
      await client.query(`
        UPDATE "Users" 
        SET "FullName" = $1, "StudentCode" = $2, "SchoolId" = $3, "IsApproved" = true, "LastUpdatedTime" = NOW()
        WHERE "Id" = $4;
      `, [u.name, u.code, userSchoolId, userId]);
    } else {
      userId = genId();
      await client.query(`
        INSERT INTO "Users" (
          "Id", "FullName", "Email", "StudentCode", "SchoolId", 
          "PasswordHash", "IsStudent", "IsAdmin", "IsApproved", 
          "IsEmailVerified", "IsTemporary", "CreatedTime", "LastUpdatedTime"
        )
        VALUES (
          $1, $2, $3, $4, $5, 
          '$2a$11$N4W4tJt.4qX4nE/K61xK4.cR9/N9X4e7dZ0j7.5n8/6V0k7o8m.6S', true, false, true, 
          true, false, NOW(), NOW()
        );
      `, [userId, u.name, u.email, u.code, userSchoolId]);
    }
    dbUserIds.push({ id: userId, ...u, schoolId: userSchoolId });
  }
  console.log(`Prepared ${dbUserIds.length} candidate users.`);

  // 4. Team Templates with full deliverables
  const teamTemplates = [
    {
      name: 'CyberPhoenix Core',
      desc: 'Giải pháp AI phát hiện bất thường & tối ưu hiệu suất luồng nghiệp vụ.',
      repo: 'https://github.com/cyberphoenix-team/seal-ai-core',
      demo: 'https://cyberphoenix.seal-hackathon.app',
      slide: 'https://docs.google.com/presentation/d/cyberphoenix-pitch-deck-2026',
    },
    {
      name: 'NovaTech Solutions',
      desc: 'Hệ thống quản lý năng lượng thông minh ứng dụng IoT & Next.js.',
      repo: 'https://github.com/novatech-solutions/smart-energy-monitor',
      demo: 'https://novatech-demo.vercel.app',
      slide: 'https://gamma.app/docs/novatech-smart-energy-presentation',
    },
    {
      name: 'AlphaGenesis Labs',
      desc: 'Nền tảng chuỗi khối bảo mật phân tán phục vụ xác thực hồ sơ sinh viên.',
      repo: 'https://github.com/alphagenesis/student-credential-blockchain',
      demo: 'https://alphagenesis-verify.surge.sh',
      slide: 'https://slides.com/alphagenesis/blockchain-verification-pitch',
    },
    {
      name: 'Quantum Devs Viet',
      desc: 'Trợ lý ảo tối ưu hóa thuật toán lập lịch thi đấu và chấm thi đa tiêu chí.',
      repo: 'https://github.com/quantum-devs/seal-scheduler-engine',
      demo: 'https://quantum-scheduler.web.app',
      slide: 'https://docs.google.com/presentation/d/quantum-devs-final-presentation',
    },
    {
      name: 'Aegis Sentinel AI',
      desc: 'Công cụ quét lỗ hổng bảo mật mã nguồn thời gian thực cho cuộc thi lập trình.',
      repo: 'https://github.com/aegis-sentinel/code-security-scanner',
      demo: 'https://aegis-scanner.seal.dev',
      slide: 'https://canva.com/design/aegis-sentinel-pitch-deck',
    },
  ];

  // 5. Seed for all events
  for (const ev of eventsRes.rows) {
    const eventId = ev.Id;
    const eventName = ev.EventName;
    console.log(`\n--- Seeding for Event: [${eventName}] (${eventId}) ---`);

    // Ensure Track
    let tracks = await client.query(`SELECT "Id", "TrackName" FROM "Tracks" WHERE "EventId" = $1;`, [eventId]);
    let trackId;
    if (tracks.rows.length === 0) {
      trackId = genId();
      await client.query(`
        INSERT INTO "Tracks" ("Id", "EventId", "TrackName", "Description", "CreatedTime", "LastUpdatedTime")
        VALUES ($1, $2, 'AI & Software Innovation', 'Hạng mục Công nghệ & Phần mềm đột phá', NOW(), NOW());
      `, [trackId, eventId]);
      console.log(`  + Created Track "AI & Software Innovation"`);
    } else {
      trackId = tracks.rows[0].Id;
    }

    // Ensure Round
    let rounds = await client.query(`SELECT "Id", "RoundName" FROM "Rounds" WHERE "EventId" = $1;`, [eventId]);
    let roundId;
    if (rounds.rows.length === 0) {
      roundId = genId();
      await client.query(`
        INSERT INTO "Rounds" ("Id", "EventId", "RoundName", "RoundNumber", "StartDate", "EndDate", "CreatedTime", "LastUpdatedTime")
        VALUES ($1, $2, 'Vòng Chung Kết (Final)', 1, NOW(), NOW() + INTERVAL '14 days', NOW(), NOW());
      `, [roundId, eventId]);
      console.log(`  + Created Round "Vòng Chung Kết (Final)"`);
    } else {
      roundId = rounds.rows[0].Id;
    }

    // Seed Teams & Submissions
    for (let tIdx = 0; tIdx < teamTemplates.length; tIdx++) {
      const tm = teamTemplates[tIdx];
      const teamName = `${tm.name}`;
      
      const existingTeam = await client.query(`SELECT "Id" FROM "Teams" WHERE "EventId" = $1 AND "Name" = $2;`, [eventId, teamName]);
      let teamId;
      if (existingTeam.rows.length > 0) {
        teamId = existingTeam.rows[0].Id;
      } else {
        teamId = genId();
        await client.query(`
          INSERT INTO "Teams" ("Id", "EventId", "TrackId", "Name", "Description", "Status", "IsActive", "CreatedTime", "LastUpdatedTime")
          VALUES ($1, $2, $3, $4, $5, 1, true, NOW() - INTERVAL '${tIdx * 2} days', NOW());
        `, [teamId, eventId, trackId, teamName, tm.desc]);
        console.log(`  + Seeded Team: "${teamName}"`);
      }

      // Assign Members (3 members per team)
      const memberOffset = (tIdx * 2) % dbUserIds.length;
      for (let mIdx = 0; mIdx < 3; mIdx++) {
        const u = dbUserIds[(memberOffset + mIdx) % dbUserIds.length];
        const roleName = mIdx === 0 ? 'TeamLeader' : 'TeamMember';

        const existingRole = await client.query(`
          SELECT "Id" FROM "EventRoles" 
          WHERE "EventId" = $1 AND "TeamId" = $2 AND "UserId" = $3;
        `, [eventId, teamId, u.id]);

        if (existingRole.rows.length === 0) {
          const roleId = genId();
          await client.query(`
            INSERT INTO "EventRoles" ("Id", "UserId", "EventId", "TeamId", "TrackId", "RoleName", "CreatedTime", "LastUpdatedTime")
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
          `, [roleId, u.id, eventId, teamId, trackId, roleName]);
        }
      }

      // Seed SubmitResult (Deliverables)
      const existingSub = await client.query(`SELECT "Id" FROM "SubmitResults" WHERE "TeamId" = $1;`, [teamId]);
      if (existingSub.rows.length === 0) {
        const subId = genId();
        await client.query(`
          INSERT INTO "SubmitResults" (
            "Id", "TeamId", "TrackId", "RoundId", 
            "RepoUrl", "DemoUrl", "SlideUrl", "SubmissionUrl", "Description", 
            "IsActive", "CreatedTime", "LastUpdatedTime"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW() - INTERVAL '${tIdx * 4} hours', NOW());
        `, [subId, teamId, trackId, roundId, tm.repo, tm.demo, tm.slide, tm.repo, tm.desc]);
        console.log(`    -> Seeded Submission: GitHub / Demo / Slides`);
      }
    }
  }

  console.log('\n=== ALL DEMO TEAMS, MEMBERS & SUBMISSIONS SEEDED SUCCESSFULLY! ===\n');
  await client.end();
}

main().catch(err => {
  console.error('Error seeding demo data:', err);
  process.exit(1);
});
