const { getPool, sql } = require("../config/db");
const axios = require("axios");
require("dotenv").config();

// WishbySMS configuration
const wishbyApiKey = process.env.WISHBY_API_KEY;
const wishbySenderId = process.env.WISHBY_SENDER_ID;
//const DLT_TE_ID_TEXT= "1707174246348497746";

// Store OTPs temporarily (in production, use Redis or another cache system)
const otpStore = {};

// Generate a random 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Function to send SMS using WishbySMS
const sendSMS = async (mobileNo, message) => {
  try {
    let phoneNumber = mobileNo.startsWith("91") ? mobileNo : "91" + mobileNo;
    console.log(phoneNumber);
    console.log(wishbyApiKey);
    console.log(wishbySenderId);

    const encodedMessage = encodeURIComponent(message);
    console.log(encodedMessage);
    let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${wishbyApiKey}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${wishbySenderId}&route=4&country=91`;

    if (process.env.DLT_TE_ID) apiUrl += `&DLT_TE_ID=${process.env.DLT_TE_ID}`;

    const response = await axios.get(apiUrl);
    return { success: true, response: response.data };
  } catch (error) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
};

// const sendTEXT = async (mobileNo, message) => {
//   try {
//     let phoneNumber = mobileNo.startsWith('91') ? mobileNo : '91' + mobileNo;
//     console.log(phoneNumber);
//     console.log(wishbyApiKey);
//     console.log(wishbySenderId);

//     const encodedMessage = encodeURIComponent(message);
//     console.log(encodedMessage);
//     let apiUrl = `https://login.wishbysms.com/api/sendhttp.php?authkey=${wishbyApiKey}&mobiles=${phoneNumber}&message=${encodedMessage}&sender=${wishbySenderId}&route=4&country=91`;

//     if (DLT_TE_ID_TEXT) apiUrl += `&DLT_TE_ID_TEXT=${DLT_TE_ID_TEXT}`;

//     const response = await axios.get(apiUrl);
//     return { success: true, response: response.data };
//   } catch (error) {
//     console.error('Error sending SMS:', error);
//     return { success: false, error: error.message };
//   }
// };

// Login and send OTP
const login = async (req, res) => {
  const { userId, password, office } = req.body;

  if (!userId || !password || !office) {
    return res
      .status(400)
      .json({ message: "User ID, password, and office are required" });
  }

  console.log(`Login attempt: UserID=${userId}, Office=${office}`);

  try {
    console.log("Attempting to get database pool for office:", office);
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }
    console.log("Database pool acquired.");

    const query = `SELECT UserId, Password, Post, MobileNo FROM [dbo].[SCreateAdmin] WHERE UserId = @userId`;
    console.log("Executing login query...");
    const result = await pool
      .request()
      .input("userId", sql.VarChar, userId)
      .query(query);
    console.log("Login query executed.");

    if (result.recordset.length === 0) {
      console.log(`User not found: ${userId}`);
      return res
        .status(404)
        .json({
          message: `Invalid credentials - User not found`,
          success: false,
        });
    }

    const user = result.recordset[0];
    console.log("User found, checking password...");

    if (user.Password !== password) {
      console.log(`Invalid password for user: ${userId}`);
      return res
        .status(401)
        .json({ message: "Invalid password", success: false });
    }
    console.log("Password verified. Generating OTP...");

    const otp = generateOTP();
    console.log(`Generated OTP: ${otp} for user: ${userId}`);

    otpStore[userId] = {
      otp,
      mobileNo: user.MobileNo,
      Name: user.Name,
      post: user.Post,
      office: office,
      expiry: Date.now() + 2 * 60 * 1000,
    };
    console.log("OTP stored. Sending SMS...");

    await sendSMS(
      user.MobileNo,
      `Your one time password login (OTP) is ${otp}  Please use it to verify your mobile number with -Swapsoft`
    );
    console.log("SMS presumably sent.");

    res.json({
      message: "OTP sent successfully",
      success: true,
      Name: user.Name,
      userId,
      post: user.Post,
      mobileNo: user.MobileNo.replace(/\d(?=\d{4})/g, "*"),
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({
        message: "An internal server error occurred during login.",
        success: false,
        error: error.message,
      });
  }
};

// Verify OTP
// Verify OTP - FIXED VERSION
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ message: "User ID and OTP are required", success: false });
  }

  try {
    if (!otpStore[userId]) {
      return res
        .status(400)
        .json({
          message:
            "No OTP request found or it has expired. Please login again.",
          success: false,
        });
    }

    const otpData = otpStore[userId];

    if (Date.now() > otpData.expiry) {
      delete otpStore[userId];
      return res
        .status(400)
        .json({
          message: "OTP has expired. Please login again.",
          success: false,
        });
    }

    if (otpData.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP", success: false });
    }

    console.log(`OTP verified successfully for user: ${userId}`);
    const verifiedOffice = otpData.office;
    delete otpStore[userId];

    // Respond with success, include office if needed later
    res.json({
      message: "Login successful",
      userId,
      post: otpData.post,
      office: verifiedOffice,
      success: true,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res
      .status(500)
      .json({
        message: "An internal server error occurred during OTP verification.",
        success: false,
      });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  const { userId, office } = req.body;

  if (!userId || !office) {
    return res
      .status(400)
      .json({ message: "User ID and office are required", success: false });
  }

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const result = await pool
      .request()
      .input("userId", sql.VarChar, userId)
      .query(
        "SELECT UserId, MobileNo, Post FROM [dbo].[SCreateAdmin] WHERE UserId = @userId"
      );

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const user = result.recordset[0];
    const currentUserId = user.UserId;

    const otp = generateOTP();
    otpStore[currentUserId] = {
      otp,
      mobileNo: user.MobileNo,
      post: user.Post,
      office: office,
      expiry: Date.now() + 2 * 60 * 1000,
    };

    await sendSMS(user.MobileNo, `Your new OTP for login is ${otp} - Swapsoft`);

    res.json({
      message: "OTP resent successfully",
      success: true,
      userId: currentUserId,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res
      .status(500)
      .json({
        message: "An internal server error occurred while resending OTP.",
        success: false,
        error: error.message,
      });
  }
};

// Profile - Now a POST request to accept userId
const profile = async (req, res) => {
  const { userId, office } = req.body;

  if (!userId || !office) {
    return res
      .status(400)
      .json({ message: "User ID and office are required", success: false });
  }

  console.log(
    `Trying to fetch profile data for User ID: ${userId} in office: ${office}`
  );

  try {
    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const result = await pool
      .request()
      .input("userId", sql.VarChar, userId)
      .query(
        "SELECT UserId, Name, Office, Post, MobileNo, Email, Image FROM [dbo].[SCreateAdmin] WHERE UserId = @userId"
      );

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No user found with this User ID", success: false });
    }

    const user = result.recordset[0];
    console.log("User profile data retrieved:", user);

    res.json({
      Image: user.Image,
      Email: user.Email,
      MobileNo: user.MobileNo,
      Post: user.Post,
      Office: user.Office,
      name: user.Name,
      userId: user.UserId,
      success: true,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res
      .status(500)
      .json({
        message: "An internal server error occurred while fetching profile.",
        success: false,
        error: error.message,
      });
  }
};

// Building MPR Report - Now a POST request with year and office
const buildingMPRreport = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
        success: false,
        message: "Year and office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
            SELECT 
                ROW_NUMBER() OVER (PARTITION BY [lekhashirsh] ORDER BY [Upvibhag] ASC) AS 'SrNo',
                a.[SubType],
                a.[LekhaShirsh] AS 'lekhashirsh',
                a.[LekhaShirshName] AS 'LekhaShirshName',
                a.[U_WIN] AS U_WIN,
                a.[KamacheName] AS kamachenaav,
                convert(NVARCHAR(max), a.[PrashaskiyAmt]) + ' ' + convert(NVARCHAR(max), a.[PrashaskiyDate]) AS prashaskiy,
                convert(NVARCHAR(max), a.[TrantrikAmt]) + ' ' + convert(NVARCHAR(max), a.[TrantrikDate]) AS tantrik,
                a.[ThekedaarName] AS thename,
                convert(NVARCHAR(max), a.[NividaKrmank]) + ' ' + convert(NVARCHAR(max), a.[NividaDate]) AS karyarambhadesh,
                a.[NividaAmt] AS nivamt,
                a.[kamachiMudat] + ' month' AS kammudat,
                b.[MarchEndingExpn] AS marchexpn,
                b.[Tartud] AS tartud,
                b.[AkunAnudan] AS akndan,
                b.[Magilkharch] AS magch,
                b.[Chalukharch] AS chalch,
                b.[AikunKharch] AS aknkharch,
                CAST(CASE 
                    WHEN MudatVadhiDate = ' ' OR MudatVadhiDate = '0'
                    THEN N'होय'
                    ELSE N'नाही'
                END AS NVARCHAR(max)) AS mudatvadh,
                [Vidyutprama] AS vidprama,
                b.[Vidyutvitarit] AS vidtarit,
                b.[Dviguni] AS dvini,
                a.[Pahanikramank] AS pankr,
                convert(NVARCHAR(max), a.[Sadyasthiti]) + ' ' + convert(NVARCHAR(max), a.[Shera]) AS shera,
                N'उपविभागीय अभियंता' + ' ' + convert(NVARCHAR(max), a.[UpabhyantaName]) + ' ' + 
                convert(NVARCHAR(max), a.[UpAbhiyantaMobile]) + N' शा.अ.- ' + convert(NVARCHAR(max), a.[ShakhaAbhyantaName]) + 
                ' ' + convert(NVARCHAR(max), a.[ShakhaAbhiyantMobile]) AS abhiyanta
            FROM BudgetMasterBuilding AS a
            JOIN BuildingProvision AS b ON a.WorkID = b.WorkID
            WHERE b.Arthsankalpiyyear = @year
        `;

    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in buildingMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching building MPR report",
      error: error.message,
    });
  }
};

// Get contractor project counts - POST request
const getContractorProjects = async (req, res) => {
  try {
    const { contractorName, office } = req.body;

    if (!contractorName || !office) {
      return res.status(400).json({
        success: false,
        message: "Contractor name and office are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
        SELECT 
            (SELECT count(*) FROM [dbo].[BudgetMasterBuilding] WHERE ThekedaarName = @contractorName) AS Building,
            (SELECT count(*) FROM [dbo].[BudgetMasterCRF] WHERE ThekedaarName = @contractorName) AS CRF,
            (SELECT count(*) FROM [dbo].[BudgetMasterAunty] WHERE ThekedaarName = @contractorName) AS Annuity,
            (SELECT count(*) FROM [dbo].[BudgetMasterDepositFund] WHERE ThekedaarName = @contractorName) AS Deposit,
            (SELECT count(*) FROM [dbo].[BudgetMasterDPDC] WHERE ThekedaarName = @contractorName) AS DPDC,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_A] WHERE ThekedaarName = @contractorName) AS Gat_A,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_D] WHERE ThekedaarName = @contractorName) AS Gat_D,
            (SELECT count(*) FROM [dbo].[BudgetMasterGAT_FBC] WHERE ThekedaarName = @contractorName) AS Gat_BCF,
            (SELECT count(*) FROM [dbo].[BudgetMasterMLA] WHERE ThekedaarName = @contractorName) AS MLA,
            (SELECT count(*) FROM [dbo].[BudgetMasterMP] WHERE ThekedaarName = @contractorName) AS MP,
            (SELECT count(*) FROM [dbo].[BudgetMasterNABARD] WHERE ThekedaarName = @contractorName) AS Nabard,
            (SELECT count(*) FROM [dbo].[BudgetMasterRoad] WHERE ThekedaarName = @contractorName) AS Road,
            (SELECT count(*) FROM [dbo].[BudgetMasterNonResidentialBuilding] WHERE ThekedaarName = @contractorName) AS NRB2059,
            (SELECT count(*) FROM [dbo].[BudgetMasterResidentialBuilding] WHERE ThekedaarName = @contractorName) AS RB2216,
            (SELECT count(*) FROM [dbo].[BudgetMaster2515] WHERE ThekedaarName = @contractorName) AS GramVikas
      `;

    const result = await pool
      .request()
      .input("contractorName", sql.NVarChar, contractorName)
      .query(query);

    const data = result.recordset[0] || {};
    const counts = {
      Building: data.Building || 0,
      CRF: data.CRF || 0,
      Annuity: data.Annuity || 0,
      Deposit: data.Deposit || 0,
      DPDC: data.DPDC || 0,
      Gat_A: data.Gat_A || 0,
      Gat_D: data.Gat_D || 0,
      Gat_BCF: data.Gat_BCF || 0,
      MLA: data.MLA || 0,
      MP: data.MP || 0,
      Nabard: data.Nabard || 0,
      Road: data.Road || 0,
      NRB2059: data.NRB2059 || 0,
      RB2216: data.RB2216 || 0,
      GramVikas: data.GramVikas || 0,
    };

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error("Error in getContractorProjects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching contractor project counts",
      error: error.message,
    });
  }
};

// CRF MPR Report - Now POST with year and office
const CrfMPRreport = async (req, res) => {
  try {
    const { year, office } = req.body;

    if (!year || !office) {
      return res.status(400).json({
        success: false,
        message: "Year and office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
            SELECT 
                a.WorkID,
                row_number() over(order by a.WorkID) as 'WorkIDl',
                a.[U_WIN] as 'U_WIN',
                a.[Dist] as 'Dist',
                a.[ArthsankalpiyBab] as 'SrNo',
                a.[KamacheName] as 'Name of work',
                convert(nvarchar(max),a.[JobNo])+' - '+convert(nvarchar(max),a.[SanctionDate]) as 'Job No',
                a.[SanctionAmount] as 'SanctionAmt',
                a.[RoadLength] as 'RoadLength',
                b.[Tartud] as 'OBP',
                b.[Chalukharch] as 'Eduringmon',
                b.[MarchEndingExpn] as 'CExpndrmonth',
                b.[Magni] as 'Demand',
                a.[NividaDate] as 'Dateofstarting',
                a.[KamPurnDate] as 'Dateofcompletion',
                a.[ThekedaarName] as 'NameofAgency',
                a.[karyarambhadesh] as 'Awardbelow',
                a.[NividaAmt] as 'Tenderedamount',
                convert(nvarchar(max),b.[Tartud])+' | '+convert(nvarchar(max),b.[Chalukharch]) as 'submissiontoMORTH',
                convert(nvarchar(max),a.[NividaAmt])+' | '+convert(nvarchar(max),a.[KamPurnDate]) as 'CompletionMORTH',
                a.[PahaniMudye] as 'Reasons',
                a.[Shera] as 'Remarks'
            FROM BudgetMasterCRF as a 
            join CRFProvision as b on a.WorkID=b.WorkID 
            where b.Arthsankalpiyyear = @year
        `;

    const result = await pool.request().input("year", year).query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in CrfMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CRF MPR report",
      error: error.message,
    });
  }
};

const NabardMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "Year parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY a.[RDF_NO] ORDER BY a.[Taluka]) as 'Sr.No',a.[RDF_NO] as 'RIDF',a.[U_WIN] as 'U_WIN',a.[Dist] as 'District',a.[Taluka] as 'Taluka' ,a.[KamacheName] as 'Name of Work',a.[PIC_NO] as 'PIC.No',cast(a.[PrashaskiyAmt] as decimal(18,2)) as 'AA Cost Rs in lakhs',cast(a.[TrantrikAmt] as decimal(18,2)) as 'Ts Cost Rs in lakhs' ,convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'Ts No and Date' ,b.[MarchEndingExpn] as 'MarchEndingExpn' ,b.[Tartud] as 'Tartud' ,b.[Magni] as 'Magni' ,b.[Magilkharch] as 'Magilkharch' ,a.[Sadyasthiti] as 'Physical progress of work' ,a.[Pahanikramank] as 'Probable of date of completion' ,a.[PCR] as 'PCR submitted or not' ,a.[Shera] as 'Remark' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in NabardMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching Nabard MPR report",
      error: error.message,
    });
  }
};

const SHDORMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[Upvibhag] as 'Upvibhag',a.[LekhaShirshName] as 'LekhaShirshName',a.PageNo as 'पेज क्र',a.ArthsankalpiyBab as 'बाब क्र',a.JulyBab as 'जुलै/ बाब क्र./पान क्र.',a.[KamacheName] as 'कामाचे नाव',b.[ManjurAmt] as ManjurAmt,b.[MarchEndingExpn] as MarchEndingExpn,b.[UrvaritAmt] as UrvaritAmt,b.[Takunone] as Takunone,b.[Takuntwo] as Takuntwo,b.[Tartud] as Tartud,b.[AkunAnudan] as AkunAnudan,b.[Magilkharch] as Magilkharch,b.[Magni] as Magni,CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,0)) as 'NS',a.[Shera] as 'शेरा' FROM BudgetMasterRoad as a join RoadProvision as b on a.Workid=b.Workid where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in SHDOR:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SHDOR MPR report",
      error: error.message,
    });
  }
};

const DPDCMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      SELECT ROW_NUMBER() OVER(PARTITION BY a.[Taluka] ORDER BY a.[WorkId]) as 'अ.क्र',a.[U_WIN] as 'U_WIN',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[Taluka] as 'तालुका',a.[LekhaShirsh] as 'योजनेचे नाव',b.[ComputerCRC] as 'सीआरसी (संगणक) संकेतांक', b.[ObjectCode] as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',a.[KamacheName] as 'योजनेचे / कामाचे नांव',  b.[ManjurAmt] as 'एकूण अंदाजित किंमत',convert(nvarchar(max),a.[NividaAmt])+' '+ convert(nvarchar(max),b.[MudatVadhiDate]) as 'सुधारित अंदाजित किंमतीचा दिनांक', b.[MarchEndingExpn] as 'MarchEndingExpn',b.[ManjurAmt] as 'ManjurAmt',b.[UrvaritAmt] as 'UrvaritAmt', b.[Tartud] as 'Tartud',a.[KamPurnDate] as 'काम पूर्ण होण्याचा अपेक्षित दिनांक', b.[Tartud]as 'Tartud',b.[AkunAnudan] as 'AkunAnudan', b.[Magilkharch] as 'Magilkharch',b.[Magni] as 'Magni',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,2)) as 'पूर्ण', CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,2)) as 'प्रगतीत', CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,2)) as 'निविदा स्तर',a.[Shera] as 'शेरा' FROM BudgetMasterDPDC as a join DPDCProvision as b on a.Workid=b.Workid where  b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in DPDCMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching DPDC MPR report",
      error: error.message,
    });
  }
};

const MLAFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT  ROW_NUMBER() OVER(PARTITION BY " + OrderBy + ")as 'अ.क्र',a.[U_WIN] as 'U_WIN',a.[PageNo] as 'प्रकार',a.[AmdaracheName] as 'आमदारांचे नाव',a.[Taluka] as 'तालुका', a.[KamacheName] as 'कामाचे नाव', convert(nvarchar(max),a.[PrashaskiyAmt])as 'एकूण अंदाजित किंमत (अलिकडील सुधारित) प्रशासकीय मान्यता किंमत',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate]) as 'निविदा क्र.व दिनांक',b.[MarchEndingExpn] as 'MarchEndingExpn',b.[ManjurAmt] as 'ManjurAmt',b.[UrvaritAmt] as 'उर्वरित किंमत',b.[Tartud] as 'Tartud',b.[AkunAnudan] as 'AkunAnudan',b.[Chalukharch] as 'Chalukharch',b.[Magni] as 'Magni', CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,2)) as 'प्रगतीत',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,2)) as 'पूर्ण', CAST(CASE WHEN a.[Sadyasthiti] = N'निविदा स्तर'  THEN 1 ELSE 0 END as decimal(10,2)) as 'निविदा स्तर',CAST(CASE WHEN a.[Sadyasthiti] = N'अंदाजपत्रकिय स्तर'  THEN 1 ELSE 0 END as decimal(10,2)) as 'अंदाजपत्रकिय स्तर',a.[Shera] as 'शेरा' FROM BudgetMasterMLA as a join MLAProvision as b on a.Workid=b.Workid where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in MLAFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching MLAFUND MPR report",
      error: error.message,
    });
  }
};

const MPFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY a.[KhasdaracheName] ORDER BY a.[PageNo])as 'अ.क्र.' ,a.[PageNo] as 'प्रकार',a.[U_WIN] as 'U_WIN' ,a.[Taluka] as 'तालुका' ,a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय बाब.क्र./प्रथम समाविष्ठ झाल्याचे वर्ष' ,a.[Type] as 'जिल्हा / योजना' ,a.[KhasdaracheName] as 'खासदाराचे नाव' ,a.[KamacheName] as 'कामाचे नाव' ,convert(nvarchar(max), a.[PrashaskiyKramank])+'/'+convert(nvarchar(max),a.[PrashaskiyDate]) as 'प्र.मा.क्र/दिनांक' ,cast(a.[PrashaskiyAmt] as decimal(18,2)) as 'प्रमाकिंमतलक्ष' ,cast(a.[TrantrikAmt] as decimal(18,2)) as 'तामाकिंमतलक्ष',convert(nvarchar(max),a.[TrantrikKrmank])+'/'+convert(nvarchar(max),a.[TrantrikDate]) as 'ता.मा.क्र/दिनांक',cast(a.[NividaAmt] as decimal(18,2))as 'निविदा किंमत' ,a.[NividaKrmank] as 'कार्यारंभ आदेश' ,b.[ManjurAmt] as 'ManjurAmt' ,b.[MarchEndingExpn] as 'MarchEndingExpn',b.[UrvaritAmt] as 'UrvaritAmt', b.[Chalukharch] as 'Chalukharch',b.[VarshbharatilKharch] as 'VarshbharatilKharch',b.[Magni] as 'मागणी रु.लक्ष',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(18,2)) as 'पूर्ण',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(18,2)) as 'प्रगतीत',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(18,2)) as 'निविदा स्तर',a.[Shera] as 'शेरा' from BudgetMasterMP as a join MPProvision as b on a.WorkId=b.WorkId where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in MPFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching MPFUND MPR report",
      error: error.message,
    });
  }
};

const DEPOSITFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[U_WIN] as 'U_WIN',a.[SubType] as subtype ,a.[KamacheName] as kamachenaav,a.[PrashaskiyAmt] as PrashaskiyAmt ,a.[PrashaskiyKramank]+' '+convert(nvarchar(max),a.[PrashaskiyDate])as prashaskiy,a.[TrantrikAmt] as TrantrikAmt,a.[TrantrikKrmank]+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,a.[ThekedaarName] as thename,convert(nvarchar(max),a.[NividaKrmank]) +' '+convert(nvarchar(max),a.[NividaDate])as karyarambhadesh,a.[NividaAmt] as nivamt,a.[kamachiMudat] +' month' as kammudat,b.[MarchEndingExpn] as marchexpn,b.[ShilakThev] as ShilakThev,b.[VitariThev] as Vitaritthev,b.[Magilkharch] as magch,b.[AikunKharch] as aknkharch,CAST(CASE WHEN MudatVadhiDate = ' ' or MudatVadhiDate = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as mudatvadh,[Vidyutprama] as vidprama,b.[Vidyutvitarit] as vidtarit,b.[Dviguni] as dvini, a.[Pahanikramank] as pankr,convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as shera,convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) +convert(nvarchar(max),a.[ShakhaAbhyantaName]) +' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as abhiyanta from BudgetMasterDepositFund as a join DepositFundProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in DEPOSITFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching DEPOSIT MPR report",
      error: error.message,
    });
  }
};

const GATAFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[Dist]as dist,a.[Upvibhag] as upvibhag,a.[KamacheName] as kamchenav,a.[WorkId] as worlId,a.[GAadeshKramank] as adeshkr,a.[GUpshirsh] as upshirsh,a.[GJobKramank]as jobkr,a.[GJobRakkam]as rakkam,a.[TrantrikKrmank]as TaAdeshkr,a.[TrantrikDate] as TaDate,a.[TrantrikAmt] as Tarakkam,a.[GDambarichePariman] as DambrichePariman,a.[GDambarichiRakkam] as damrichiRakkam,cast(a.[NividaAmt] as decimal(10,2)) as Nividaamt,a.[ThekedaarName] as ThekdarNav,a.[karyarambhadesh]+' '+ a.[NividaDate] as NiAdeshKr,a.[NividaKrmank]as nividakr,a.[kamachiMudat] as Kamachimudat,CAST(CASE WHEN a.[Sadyasthiti] = 'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = 'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = 'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'O',a.[GKampurnKarnyachaDinak] as kamPurndate,a.[GKampurnJhalyachaDinak] as kampurnzalyadate,a.[GDeyakSadarKelyachaDinak] as vibhagatdeyak,a.[GParitKelyachaDinak]as vibhagtParit,b.[VarshbharatilKharch] as kamvrzalelakhrch,b.[DambarichaExpen] as dambrichakhrch,b.[AikunKharch] as ekunkhrch,b.[ShilakDayitvAmt] as shilakdayitv,b.[DayitvAvshyakYesNo] as DayitvAvshyakYesNo,b.[DayitvAmt]  as DayitvAmt,a.[GVaperDambarichePariman]as vaperdaPariman,a.[ShakhaAbhyantaName]+' '+[ShakhaAbhiyantMobile] as ShakhaName,a.[UpabhyantaName]+' '+a.[UpAbhiyantaMobile] as upabhyanta,a.Shera as shera from [BudgetMasterGAT_A] as a join [GAT_AProvision] as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GATAFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GATA MPR report",
      error: error.message,
    });
  }
};

const GATFFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[U_WIN] as 'U_WIN',a.[KamacheName] as kamachenav,a.[GRoadKramank] as RastaKr,a.[GlengthStarted] as Pasun,a.[GlengthUpto] as Pryant,a.[GlengthTotal] as Ekun,a.[GRoadPrushthbhag] as Prustbhag,a.[GRoll] as Pikroll,a.[GNewKhadikaran] as navinkhdikarn,a.[GBM_Carpet] as BMCarpet,a.[G20_MM] as mmcarpetsah,a.[GSurface]as serface,a.[GRundikaran] as rundikarn,a.[GBridge_Morya]as Pull,a.[GAnya] as anya,a.[GRepairExpn] as DurustichaKhrch,b.[KamachiKimat]as kamchikinmat,a.[GJobKramank]as jobkr,a.Shera as shera  from [BudgetMasterGAT_FBC] as a join [GAT_FBCProvision] as b on a.WorkID=b.WorkID where a.[Type]=N'गट एफ' and b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GATFFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GATF MPR report",
      error: error.message,
    });
  }
};

const GATDFUNDMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[Dist] as dist,a.[Upvibhag] as upvibhag,cast(a.[ForDepartment] as decimal(10,2))as Sasnanenemundilele,cast(a.[DepartmentDecided] as decimal(10,2)) as Pradeshikvibhag,a.[FromAccident]as pasun,a.[AccidentExecuted] as pryant,a.[KamacheName] as kamachenav,a.[Kamachevav]as varnan,a.AccidentKaryvahi as ApghatKaryvahi,b.VidyutikaranAmt as kamachikinmat,a.Sadyasthiti as sadyastiti,b.VidyutikaranExpen as zalelakhrch,b.Magni as nidhi,a.Shera as shera  from [BudgetMasterGAT_D] as a join [GAT_DProvision] as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "' and a.[Type]=N'GAT_D'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GATDFUNDMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GATD MPR report",
      error: error.message,
    });
  }
};

const ResBuilMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
      SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',  a.[KamacheName] as kamachenaav,convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as prashaskiy,convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,a.[ThekedaarName] as thename,convert(nvarchar(max),a.[NividaKrmank]) +' '+convert(nvarchar(max),a.[NividaDate])as karyarambhadesh,a.[NividaAmt] as nivamt,a.[kamachiMudat] +' month' as kammudat,b.[MarchEndingExpn] as marchexpn,b.[Tartud] as tartud,b.[AkunAnudan] as akndan,b.[Magilkharch] as magch,b.[Chalukharch] as chalch,b.[AikunKharch] as aknkharch,CAST(CASE WHEN MudatVadhiDate = ' ' or MudatVadhiDate = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as mudatvadh,[Vidyutprama] as vidprama,b.[Vidyutvitarit] as vidtarit,b.[Dviguni] as dvini, a.[Pahanikramank] as pankr,convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as shera, N'उपविभागीय अभियंता'+' '+convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) +N' शा.अ.- '+convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as abhiyanta from BudgetMasterResidentialBuilding as a join ResidentialBuildingProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in ResBuilMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching ResBuil MPR report",
      error: error.message,
    });
  }
};

const NonResBuilMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',  a.[KamacheName] as kamachenaav,convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as prashaskiy,convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,a.[ThekedaarName] as thename,convert(nvarchar(max),a.[NividaKrmank]) +' '+convert(nvarchar(max),a.[NividaDate])as karyarambhadesh,a.[NividaAmt] as nivamt,a.[kamachiMudat] +' month' as kammudat,b.[MarchEndingExpn] as marchexpn,b.[Tartud] as tartud,b.[AkunAnudan] as akndan,b.[Magilkharch] as magch,b.[Chalukharch] as chalch,b.[AikunKharch] as aknkharch,CAST(CASE WHEN MudatVadhiDate = ' ' or MudatVadhiDate = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as mudatvadh,[Vidyutprama] as vidprama,b.[Vidyutvitarit] as vidtarit,b.[Dviguni] as dvini, a.[Pahanikramank] as pankr,convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as shera, N'उपविभागीय अभियंता'+' '+convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) +N' शा.अ.- '+convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as abhiyanta from BudgetMasterNonResidentialBuilding as a join NonResidentialBuildingProvision as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in NonResBuilMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching NonRes MPR report",
      error: error.message,
    });
  }
};

const GramvikasMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[SubType] ,a.[U_WIN] as 'U_WIN',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',  a.[KamacheName] as kamachenaav,convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as prashaskiy,convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max), a.[TrantrikDate]) as tantrik,a.[ThekedaarName] as thename,convert(nvarchar(max),a.[NividaKrmank]) +' '+convert(nvarchar(max),a.[NividaDate])as karyarambhadesh,a.[NividaAmt] as nivamt,a.[kamachiMudat] +' month' as kammudat,b.[MarchEndingExpn] as marchexpn,b.[Tartud] as tartud,b.[AkunAnudan] as akndan,b.[Magilkharch] as magch,b.[Chalukharch] as chalch,b.[AikunKharch] as aknkharch,CAST(CASE WHEN MudatVadhiDate = ' ' or MudatVadhiDate = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as mudatvadh,[Vidyutprama] as vidprama,b.[Vidyutvitarit] as vidtarit,b.[Dviguni] as dvini, a.[Pahanikramank] as pankr,convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as shera, N'उपविभागीय अभियंता'+' '+convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) +N' शा.अ.- '+convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as abhiyanta from [BudgetMaster2515] as a join [2515Provision] as b on a.WorkID=b.WorkID where b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GramvikasMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching Gramvikas MPR report",
      error: error.message,
    });
  }
};

const GATBMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[U_WIN] as 'U_WIN',a.[KamacheName] as kamachenav,a.[GRoadKramank] as RastaKr,a.[GlengthStarted] as Pasun,a.[GlengthUpto] as Pryant,a.[GlengthTotal] as Ekun,a.[GRoadPrushthbhag] as Prustbhag,a.[GRoll] as Pikroll,a.[GNewKhadikaran] as navinkhdikarn,a.[GBM_Carpet] as BMCarpet,a.[G20_MM] as mmcarpetsah,a.[GSurface]as serface,a.[GRundikaran] as rundikarn,a.[GBridge_Morya]as Pull,a.[GAnya] as anya,a.[GRepairExpn] as DurustichaKhrch,b.[KamachiKimat]as kamchikinmat,a.[GJobKramank]as jobkr,a.Shera as shera  from [BudgetMasterGAT_FBC] as a join [GAT_FBCProvision] as b on a.WorkID=b.WorkID where a.[Type]=N'गट बी' and b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GATBMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GATB MPR report",
      error: error.message,
    });
  }
};

const GATCMPRreport = async (req, res) => {
  try {
    const { office } = req.body;

    if (!office) {
      return res.status(400).json({
        success: false,
        message: "office parameters are required",
      });
    }

    const pool = await getPool(office);
    if (!pool) {
      throw new Error(`Database pool is not available for office ${office}.`);
    }

    const query = `
SELECT ROW_NUMBER() OVER(PARTITION BY [lekhashirsh] ORDER BY [SubType]) as 'SrNo',a.[LekhaShirsh] as 'lekhashirsh',a.[LekhaShirshName] as 'LekhaShirshName',a.[U_WIN] as 'U_WIN',a.[KamacheName] as kamachenav,a.[GRoadKramank] as RastaKr,a.[GlengthStarted] as Pasun,a.[GlengthUpto] as Pryant,a.[GlengthTotal] as Ekun,a.[GRoadPrushthbhag] as Prustbhag,a.[GRoll] as Pikroll,a.[GNewKhadikaran] as navinkhdikarn,a.[GBM_Carpet] as BMCarpet,a.[G20_MM] as mmcarpetsah,a.[GSurface]as serface,a.[GRundikaran] as rundikarn,a.[GBridge_Morya]as Pull,a.[GAnya] as anya,a.[GRepairExpn] as DurustichaKhrch,b.[KamachiKimat]as kamchikinmat,a.[GJobKramank]as jobkr,a.Shera as shera  from [BudgetMasterGAT_FBC] as a join [GAT_FBCProvision] as b on a.WorkID=b.WorkID where a.[Type]=N'गट सी' and b.Arthsankalpiyyear='" + ddlArthYear.SelectedItem.Text + "'
      `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in GATCMPRreport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching GATC MPR report",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  verifyOTP,
  resendOTP,
  profile,
  buildingMPRreport,
  CrfMPRreport,
  getContractorProjects,
  NabardMPRreport,
  SHDORMPRreport,
  DPDCMPRreport,
  MLAFUNDMPRreport,
  MPFUNDMPRreport,
  DEPOSITFUNDMPRreport,
  GATAFUNDMPRreport,
  GATFFUNDMPRreport,
  GATDFUNDMPRreport,
  ResBuilMPRreport,
  NonResBuilMPRreport,
  GramvikasMPRreport,
  GATBMPRreport,
  GATCMPRreport,
};
