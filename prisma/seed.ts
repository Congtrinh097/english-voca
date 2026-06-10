import { PrismaClient, Level } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedWord = [word: string, ipa: string, pos: string, def: string, ex: string, vi: string];

const topics: { title: string; titleVi: string; level: Level; description: string; words: SeedWord[] }[] = [
  {
    title: "Daily Activities",
    titleVi: "Hoat dong hang ngay",
    level: "beginner",
    description: "Common verbs and phrases for everyday routines.",
    words: [
      ["wake up", "/weɪk ʌp/", "verb", "To stop sleeping", "I wake up at 6 a.m. every day.", "thuc day"],
      ["breakfast", "/ˈbrekfəst/", "noun", "The first meal of the day", "She eats breakfast before work.", "bua sang"],
      ["commute", "/kəˈmjuːt/", "verb", "To travel regularly to work", "He commutes by bus.", "di lam (di chuyen)"],
      ["exercise", "/ˈeksəsaɪz/", "noun", "Physical activity to stay healthy", "Exercise keeps you fit.", "tap the duc"],
      ["shower", "/ˈʃaʊə/", "noun", "Washing yourself under running water", "I take a shower every morning.", "tam voi sen"],
      ["lunch", "/lʌntʃ/", "noun", "A meal eaten in the middle of the day", "We had lunch together.", "bua trua"],
      ["nap", "/næp/", "noun", "A short sleep during the day", "A short nap boosts energy.", "giac ngu ngan"],
      ["chore", "/tʃɔː/", "noun", "A routine task, especially at home", "Washing dishes is my least favorite chore.", "viec nha"],
      ["schedule", "/ˈʃedjuːl/", "noun", "A plan of activities and times", "My schedule is full today.", "lich trinh"],
      ["habit", "/ˈhæbɪt/", "noun", "Something you do regularly", "Reading is a good habit.", "thoi quen"],
      ["sleep", "/sliːp/", "verb", "To rest with eyes closed at night", "Children need to sleep early.", "ngu"],
      ["dinner", "/ˈdɪnə/", "noun", "The main meal of the evening", "Dinner is ready at seven.", "bua toi"],
    ],
  },
  {
    title: "Food & Drinks",
    titleVi: "Do an & Thuc uong",
    level: "beginner",
    description: "Basic vocabulary about food, drinks and taste.",
    words: [
      ["delicious", "/dɪˈlɪʃəs/", "adj", "Having a very pleasant taste", "This soup is delicious.", "ngon"],
      ["vegetable", "/ˈvedʒtəbl/", "noun", "A plant eaten as food", "Eat more vegetables.", "rau cu"],
      ["beverage", "/ˈbevərɪdʒ/", "noun", "Any type of drink", "Coffee is a popular beverage.", "do uong"],
      ["spicy", "/ˈspaɪsi/", "adj", "Having a strong hot flavor", "Thai food is often spicy.", "cay"],
      ["recipe", "/ˈresəpi/", "noun", "Instructions for cooking a dish", "She shared her cake recipe.", "cong thuc nau an"],
      ["snack", "/snæk/", "noun", "A small amount of food between meals", "Fruit is a healthy snack.", "do an vat"],
      ["sour", "/ˈsaʊə/", "adj", "Having a sharp acid taste", "Lemons are sour.", "chua"],
      ["grill", "/ɡrɪl/", "verb", "To cook over direct heat", "We grilled chicken last night.", "nuong"],
      ["ingredient", "/ɪnˈɡriːdiənt/", "noun", "One of the foods used to make a dish", "Mix all the ingredients well.", "nguyen lieu"],
      ["dessert", "/dɪˈzɜːt/", "noun", "Sweet food eaten after a meal", "Ice cream is my favorite dessert.", "mon trang mieng"],
      ["boil", "/bɔɪl/", "verb", "To cook in very hot water", "Boil the eggs for ten minutes.", "luoc"],
      ["fresh", "/freʃ/", "adj", "Recently made or picked, not old", "I bought fresh fish today.", "tuoi"],
    ],
  },
  {
    title: "Business English",
    titleVi: "Tieng Anh thuong mai",
    level: "middle",
    description: "Vocabulary for office work, meetings and negotiation.",
    words: [
      ["deadline", "/ˈdedlaɪn/", "noun", "The latest time something must be done", "The deadline is Friday.", "han chot"],
      ["negotiate", "/nɪˈɡəʊʃieɪt/", "verb", "To discuss to reach an agreement", "We negotiated a better price.", "dam phan"],
      ["revenue", "/ˈrevənjuː/", "noun", "Money a company receives", "Revenue grew by 20%.", "doanh thu"],
      ["stakeholder", "/ˈsteɪkhəʊldə/", "noun", "A person with an interest in a business", "Inform all stakeholders.", "ben lien quan"],
      ["proposal", "/prəˈpəʊzl/", "noun", "A formal plan or suggestion", "The client approved our proposal.", "de xuat"],
      ["budget", "/ˈbʌdʒɪt/", "noun", "Money available for a purpose", "We are over budget this month.", "ngan sach"],
      ["colleague", "/ˈkɒliːɡ/", "noun", "A person you work with", "My colleagues are friendly.", "dong nghiep"],
      ["agenda", "/əˈdʒendə/", "noun", "A list of items for a meeting", "What is on the agenda today?", "chuong trinh hop"],
      ["invoice", "/ˈɪnvɔɪs/", "noun", "A bill for goods or services", "Send the invoice to accounting.", "hoa don"],
      ["promotion", "/prəˈməʊʃn/", "noun", "A move to a higher position", "She got a promotion last year.", "thang chuc"],
      ["contract", "/ˈkɒntrækt/", "noun", "A legal written agreement", "Sign the contract here.", "hop dong"],
      ["profit", "/ˈprɒfɪt/", "noun", "Money gained after costs", "The company made a large profit.", "loi nhuan"],
    ],
  },
  {
    title: "Travel & Transportation",
    titleVi: "Du lich & Giao thong",
    level: "middle",
    description: "Words for trips, airports and getting around.",
    words: [
      ["itinerary", "/aɪˈtɪnərəri/", "noun", "A detailed plan of a journey", "Our itinerary includes three cities.", "lich trinh chuyen di"],
      ["departure", "/dɪˈpɑːtʃə/", "noun", "The act of leaving a place", "Check the departure time.", "khoi hanh"],
      ["luggage", "/ˈlʌɡɪdʒ/", "noun", "Bags carried while traveling", "My luggage was lost.", "hanh ly"],
      ["destination", "/ˌdestɪˈneɪʃn/", "noun", "The place you are going to", "Paris is a popular destination.", "diem den"],
      ["accommodation", "/əˌkɒməˈdeɪʃn/", "noun", "A place to stay", "The hotel offers cheap accommodation.", "cho o"],
      ["passport", "/ˈpɑːspɔːt/", "noun", "An official travel document", "Show your passport at the gate.", "ho chieu"],
      ["delay", "/dɪˈleɪ/", "noun", "A period of waiting longer than planned", "The flight has a two-hour delay.", "su tre/hoan"],
      ["sightseeing", "/ˈsaɪtsiːɪŋ/", "noun", "Visiting interesting places", "We went sightseeing downtown.", "tham quan"],
      ["fare", "/feə/", "noun", "Money paid for transport", "The bus fare is two dollars.", "tien ve"],
      ["customs", "/ˈkʌstəmz/", "noun", "The airport area checking goods", "We passed through customs quickly.", "hai quan"],
      ["reservation", "/ˌrezəˈveɪʃn/", "noun", "An arrangement to keep a seat or room", "I made a reservation online.", "dat cho"],
      ["souvenir", "/ˌsuːvəˈnɪə/", "noun", "A thing kept to remember a place", "She bought souvenirs for friends.", "qua luu niem"],
    ],
  },
  {
    title: "Academic Writing",
    titleVi: "Viet hoc thuat",
    level: "master",
    description: "Advanced vocabulary for essays and research.",
    words: [
      ["hypothesis", "/haɪˈpɒθəsɪs/", "noun", "An idea tested by research", "The data supports our hypothesis.", "gia thuyet"],
      ["empirical", "/ɪmˈpɪrɪkl/", "adj", "Based on observation or experiment", "Empirical evidence is required.", "thuc nghiem"],
      ["synthesize", "/ˈsɪnθəsaɪz/", "verb", "To combine ideas into a whole", "Synthesize the findings of both studies.", "tong hop"],
      ["paradigm", "/ˈpærədaɪm/", "noun", "A typical model or framework", "This marks a paradigm shift.", "mo hinh/he hinh"],
      ["cite", "/saɪt/", "verb", "To refer to a source as evidence", "Always cite your sources.", "trich dan"],
      ["ambiguous", "/æmˈbɪɡjuəs/", "adj", "Having more than one meaning", "The phrase is ambiguous.", "mo ho"],
      ["methodology", "/ˌmeθəˈdɒlədʒi/", "noun", "A system of research methods", "Describe your methodology clearly.", "phuong phap luan"],
      ["coherent", "/kəʊˈhɪərənt/", "adj", "Logical and well organized", "Write a coherent argument.", "mach lac"],
      ["plagiarism", "/ˈpleɪdʒərɪzəm/", "noun", "Copying another's work as your own", "Plagiarism leads to expulsion.", "dao van"],
      ["refute", "/rɪˈfjuːt/", "verb", "To prove a statement wrong", "The study refutes earlier claims.", "bac bo"],
      ["implication", "/ˌɪmplɪˈkeɪʃn/", "noun", "A possible effect or result", "Discuss the implications of the result.", "ham y/he qua"],
      ["concise", "/kənˈsaɪs/", "adj", "Giving information clearly in few words", "Keep your abstract concise.", "suc tich"],
    ],
  },
  {
    title: "Technology & Innovation",
    titleVi: "Cong nghe & Doi moi",
    level: "master",
    description: "Advanced terms about modern technology.",
    words: [
      ["algorithm", "/ˈælɡərɪðəm/", "noun", "A set of rules for solving a problem", "The algorithm sorts data quickly.", "thuat toan"],
      ["breakthrough", "/ˈbreɪkθruː/", "noun", "An important discovery", "A breakthrough in battery design.", "dot pha"],
      ["obsolete", "/ˈɒbsəliːt/", "adj", "No longer used; out of date", "Fax machines are obsolete.", "loi thoi"],
      ["scalable", "/ˈskeɪləbl/", "adj", "Able to grow without problems", "We need a scalable system.", "co kha nang mo rong"],
      ["cybersecurity", "/ˌsaɪbəsɪˈkjʊərəti/", "noun", "Protection of computer systems", "Cybersecurity threats are rising.", "an ninh mang"],
      ["automation", "/ˌɔːtəˈmeɪʃn/", "noun", "Use of machines instead of people", "Automation reduces manual work.", "tu dong hoa"],
      ["prototype", "/ˈprəʊtətaɪp/", "noun", "A first model of a product", "We built a working prototype.", "ban mau"],
      ["disruptive", "/dɪsˈrʌptɪv/", "adj", "Changing an industry completely", "A disruptive technology emerged.", "mang tinh dot pha"],
      ["bandwidth", "/ˈbændwɪdθ/", "noun", "Capacity of a network connection", "Video calls need more bandwidth.", "bang thong"],
      ["interface", "/ˈɪntəfeɪs/", "noun", "The way users interact with software", "The interface is intuitive.", "giao dien"],
      ["latency", "/ˈleɪtənsi/", "noun", "Delay before data transfer begins", "Low latency matters in gaming.", "do tre"],
      ["encryption", "/ɪnˈkrɪpʃn/", "noun", "Converting data into secret code", "Encryption protects your messages.", "ma hoa"],
    ],
  },
];

const GLORY: Record<Level, number> = { beginner: 10, middle: 15, master: 20 };

async function main() {
  // Admin mac dinh — DOI MAT KHAU SAU KHI DANG NHAP LAN DAU
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: await bcrypt.hash("admin12345", 12),
      emailVerified: true,
      role: "admin",
    },
  });

  for (const t of topics) {
    const existing = await prisma.topic.findFirst({ where: { title: t.title } });
    if (existing) continue;

    await prisma.topic.create({
      data: {
        title: t.title,
        titleVi: t.titleVi,
        description: t.description,
        level: t.level,
        gloryReward: GLORY[t.level],
        isPublished: true,
        createdBy: admin.id,
        words: {
          create: t.words.map(([word, ipa, pos, def, ex, vi], i) => ({
            word,
            pronunciation: ipa,
            partOfSpeech: pos,
            definition: def,
            example: ex,
            meaningVi: vi,
            orderIndex: i,
          })),
        },
      },
    });
  }

  console.log("Seed xong: admin@example.com / admin12345 + 6 topics x 12 words");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
