const { getPool, sql } = require("../config/db");

const BUILDINGHEADWISEREPORT = async (req, res) => {
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
SELECT ROW_NUMBER() OVER (
		PARTITION BY a.[LekhaShirshName] ORDER BY a.[LekhaShirshName]
			,a.[Arthsankalpiyyear]
			,a.[upvibhag]
		) AS 'SrNo'
	,a.[WorkId] AS 'वर्क आयडी'
	,a.[U_WIN] AS 'U_WIN'
	,a.[Arthsankalpiyyear] AS 'अर्थसंकल्पीय वर्ष'
	,a.[KamacheName] AS 'कामाचे नाव'
	,a.[LekhaShirshName] AS 'लेखाशीर्ष नाव'
	,a.[SubType] AS 'विभाग'
	,a.[Upvibhag] AS 'उपविभाग'
	,a.[Taluka] AS 'तालुका'
	,a.[ArthsankalpiyBab] AS 'अर्थसंकल्पीय बाब'
	,convert(NVARCHAR(max), a.[ShakhaAbhyantaName]) + ' ' + convert(NVARCHAR(max), a.[ShakhaAbhiyantMobile]) AS 'शाखा अभियंता नाव'
	,convert(NVARCHAR(max), a.[UpabhyantaName]) + ' ' + convert(NVARCHAR(max), a.[UpAbhiyantaMobile]) AS 'उपअभियंता नाव'
	,a.[AmdaracheName] AS 'आमदारांचे नाव'
	,a.[KhasdaracheName] AS 'खासदारांचे नाव'
	,convert(NVARCHAR(max), a.[ThekedaarName]) + ' ' + convert(NVARCHAR(max), a.[ThekedarMobile]) AS 'ठेकेदार नाव'
	,convert(NVARCHAR(max), a.[PrashaskiyAmt]) AS 'प्रशासकीय मान्यता रक्कम'
	,convert(NVARCHAR(max), a.[PrashaskiyKramank]) + ' ' + convert(NVARCHAR(max), a.[PrashaskiyAmt]) + ' ' + convert(NVARCHAR(max), a.[PrashaskiyDate]) AS 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक'
	,convert(NVARCHAR(max), a.[TrantrikAmt]) AS 'तांत्रिक मान्यता रक्कम'
	,convert(NVARCHAR(max), a.[TrantrikKrmank]) + ' ' + convert(NVARCHAR(max), a.[TrantrikAmt]) + ' ' + convert(NVARCHAR(max), a.[TrantrikDate]) AS 'तांत्रिक मान्यता क्र/रक्कम/दिनांक'
	,a.[Kamachevav] AS 'कामाचा वाव'
	,convert(NVARCHAR(max), a.[NividaKrmank]) + ' ' + convert(NVARCHAR(max), a.[NividaDate]) AS 'कार्यारंभ आदेश दिनांक'
	,a.[NividaAmt] AS 'निविदा रक्कम % कमी / जास्त'
	,a.[kamachiMudat] AS 'बांधकाम कालावधी'
	,a.[KamPurnDate] AS 'काम पूर्ण तारीख'
	,CAST(CASE 
			WHEN b.[MudatVadhiDate] = ' '
				OR b.[MudatVadhiDate] = '0'
				THEN N'होय'
			ELSE N'नाही'
			END AS NVARCHAR(max)) AS 'मुदतवाढ बाबत'
	,b.[ManjurAmt] AS 'मंजूर अंदाजित किंमत'
	,b.[MarchEndingExpn] AS 'मार्च अखेर खर्च 2021'
	,b.[UrvaritAmt] AS 'उर्वरित किंमत'
	,b.[Chalukharch] AS 'चालु खर्च'
	,b.[Magilkharch] AS 'मागील खर्च'
	,b.[VarshbharatilKharch] AS 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च'
	,b.[AikunKharch] AS 'एकुण कामावरील खर्च'
	,b.[Takunone] AS 'प्रथम तिमाही तरतूद'
	,b.[Takuntwo] AS 'द्वितीय तिमाही तरतूद'
	,b.[Takunthree] AS 'तृतीय तिमाही तरतूद'
	,b.[Takunfour] AS 'चतुर्थ तिमाही तरतूद'
	,b.[Tartud] AS 'अर्थसंकल्पीय तरतूद'
	,b.[AkunAnudan] AS 'वितरित तरतूद'
	,b.[Magni] AS 'मागणी'
	,b.[Vidyutprama] AS 'विद्युतीकरणावरील प्रमा'
	,b.[Vidyutvitarit] AS 'विद्युतीकरणावरील वितरित'
	,b.[Itarkhrch] AS 'इतर खर्च'
	,b.[Dviguni] AS 'दवगुनी ज्ञापने'
	,a.[Pahanikramank] AS 'पाहणी क्रमांक'
	,a.[PahaniMudye] AS 'पाहणीमुद्ये'
	,b.[DeyakachiSadyasthiti] AS 'देयकाची सद्यस्थिती'
	,convert(NVARCHAR(max), a.[Sadyasthiti]) + ' ' + convert(NVARCHAR(max), a.[Shera]) AS 'शेरा / कामाची सद्यस्थिती'
	,CAST(CASE 
			WHEN a.[Sadyasthiti] = N'पूर्ण'
				THEN 1
			ELSE 0
			END AS DECIMAL(10, 0)) AS 'C'
	,CAST(CASE 
			WHEN a.[Sadyasthiti] = N'प्रगतीत'
				THEN 1
			ELSE 0
			END AS DECIMAL(10, 0)) AS 'P'
	,CAST(CASE 
			WHEN a.[Sadyasthiti] = N'निविदा स्तर'
				THEN 1
			ELSE 0
			END AS DECIMAL(10, 0)) AS 'TS'
	,b.[Apr] AS 'Apr'
	,b.[May] AS 'May'
	,b.[Jun] AS 'Jun'
	,b.[Jul] AS 'Jul'
	,b.[Aug] AS 'Aug'
	,b.[Sep] AS 'Sep'
	,b.[Oct] AS 'Oct'
	,b.[Nov] AS 'Nov'
	,b.[Dec] AS 'Dec'
	,b.[Jan] AS 'Jan'
	,b.[Feb] AS 'Feb'
	,b.[Mar] AS 'Mar'
FROM BudgetMasterBuilding AS a
JOIN BuildingProvision AS b ON a.WorkId = b.WorkId
WHERE a.Arthsankalpiyyear = '2023-2024'
	AND b.[Arthsankalpiyyear] = N'2023-2024'
	AND a.[Sadyasthiti] = N'पूर्ण'

UNION

SELECT isNULL('', '') AS 'SrNo'
	,'Total' AS 'वर्क आयडी'
	,isNULL('', '') AS 'U_WIN'
	,isNULL('Total', '') AS 'अर्थसंकल्पीय वर्ष'
	,isNULL('', '') AS 'कामाचे नाव'
	,isNULL(a.[LekhaShirshName], '') AS 'लेखाशीर्ष नाव'
	,isNULL('', '') AS 'विभाग'
	,isNULL('', '') AS 'उपविभाग'
	,isNULL('', '0') AS 'तालुका'
	,isNULL('', '') AS 'अर्थसंकल्पीय बाब'
	,isNULL('', '') AS 'शाखा अभियंता नाव'
	,isNULL('', '') AS 'उपअभियंता नाव'
	,isNULL('', '') AS 'आमदारांचे नाव'
	,isNULL('', '') AS 'खासदारांचे नाव'
	,isNULL('', '') AS 'ठेकेदार नाव'
	,sum(cast(a.[PrashaskiyAmt] AS DECIMAL(10, 2))) AS 'प्रशासकीय मान्यता रक्कम'
	,isNULL('', '') AS 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक'
	,sum(cast(a.[TrantrikAmt] AS DECIMAL(10, 2))) AS 'तांत्रिक मान्यता रक्कम'
	,isNULL('', '') AS 'तांत्रिक मान्यता क्र/रक्कम/दिनांक '
	,isNULL('', '') AS 'कामाचा वाव'
	,isNULL('', '') AS 'कार्यारंभ आदेश दिनांक'
	,isNULL('', '') AS 'निविदा रक्कम % कमी / जास्त'
	,isNULL('', '') AS 'बांधकाम कालावधी'
	,isNULL('', '') AS 'काम पूर्ण तारीख'
	,isNULL('', '') AS 'मुदतवाढ बाबत'
	,sum(b.[ManjurAmt]) AS 'मंजूर अंदाजित किंमत'
	,sum(b.[MarchEndingExpn]) AS 'मार्च अखेर खर्च 2021'
	,sum(b.[UrvaritAmt]) AS 'उर्वरित किंमत'
	,sum(b.[Chalukharch]) AS 'चालु खर्च'
	,sum(b.[Magilkharch]) AS 'मागील खर्च'
	,sum(b.[VarshbharatilKharch]) AS 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च'
	,sum(b.[AikunKharch]) AS 'एकुण कामावरील खर्च'
	,sum(b.[Takunone]) AS 'प्रथम तिमाही तरतूद'
	,sum(b.[Takuntwo]) AS 'द्वितीय तिमाही तरतूद'
	,sum(b.[Takunthree]) AS 'तृतीय तिमाही तरतूद'
	,sum(b.[Takunfour]) AS 'चतुर्थ तिमाही तरतूद'
	,sum(b.[Tartud]) AS 'अर्थसंकल्पीय तरतूद'
	,sum(b.[AkunAnudan]) AS 'वितरित तरतूद'
	,sum(b.[Magni]) AS 'मागणी'
	,sum(b.[Vidyutprama]) AS 'प्रमा'
	,sum(b.[Vidyutvitarit]) AS 'वितरित'
	,sum(b.[Itarkhrch]) AS 'इतर खर्च'
	,isNULL('', '') AS 'दवगुनी ज्ञापने'
	,isNULL('', '') AS 'पाहणी क्रमांक'
	,isNULL('', '') AS 'पाहणीमुद्ये'
	,isNULL('', '') AS 'देयकाची सद्यस्थिती'
	,isNULL('', '') AS 'शेरा / कामाची सद्यस्थिती'
	,sum(CAST(CASE 
				WHEN a.[Sadyasthiti] = N'पूर्ण'
					THEN 1
				ELSE 0
				END AS DECIMAL(10, 0))) AS 'C'
	,sum(CAST(CASE 
				WHEN a.[Sadyasthiti] = N'प्रगतीत'
					THEN 1
				ELSE 0
				END AS DECIMAL(10, 0))) AS 'P'
	,sum(CAST(CASE 
				WHEN a.[Sadyasthiti] = N'निविदा स्तर'
					THEN 1
				ELSE 0
				END AS DECIMAL(10, 0))) AS 'TS'
	,sum(b.[Apr]) AS [Apr]
	,sum(b.[May]) AS [May]
	,sum(b.[Jun]) AS [Jun]
	,sum(b.[Jul]) AS [Jul]
	,sum(b.[Aug]) AS [Aug]
	,sum(b.[Sep]) AS [Sep]
	,sum(b.[Oct]) AS [Oct]
	,sum(b.[Nov]) AS [Nov]
	,sum(b.[Dec]) AS [Dec]
	,sum(b.[Jan]) AS [Jan]
	,sum(b.[Feb]) AS [Feb]
	,sum(b.[Mar]) AS [Mar]
FROM BudgetMasterBuilding AS a
JOIN BuildingProvision AS b ON a.WorkId = b.WorkId
WHERE a.Arthsankalpiyyear = '2023-2024'
	AND b.[Arthsankalpiyyear] = N'2023-2024'
	AND a.[Sadyasthiti] = N'पूर्ण'
GROUP BY a.[LekhaShirshName]
ORDER BY a.[LekhaShirshName]
	,a.[Arthsankalpiyyear]
	,a.[upvibhag]
        `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in BUILDINGHEADWISEREPORT:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching BUILDINGHEADWISEREPORT",
      error: error.message,
    });
  }
};

const CRFHEADWISEREPORT = async (req, res) => {
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
        SELECT ROW_NUMBER() OVER(PARTITION BY a.[Arthsankalpiyyear] ORDER BY a.[Arthsankalpiyyear],a.[upvibhag]desc) as 'SrNo', a.[WorkId] as 'WorkId',a.[U_WIN] as 'U_WIN',a.[ArthsankalpiyBab] as 'Budget of Item',a.[Arthsankalpiyyear] as 'Budget of Year',a.[KamacheName] as 'Name of Work',a.[LekhaShirsh] as 'Head',a.[LekhaShirshName] as 'Headwise',a.[Type] as 'Type',a.[SubType] as 'SubType',a.[Upvibhag] as 'Sub Division',a.[Taluka] as 'Taluka',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'Sectional Engineer',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'Deputy Engineer',a.[AmdaracheName] as 'MLA',a.[KhasdaracheName] as 'MP',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'Contractor',a.[PrashaskiyKramank] as 'Administrative No',a.[PrashaskiyDate] as 'A A Date',a.[PrashaskiyAmt] as 'A A Amount',a.[TrantrikKrmank] as 'Technical Sanction No',a.[TrantrikDate] as 'T S Date',a.[TrantrikAmt] as 'T S Amount',a.[Kamachavav] as 'Scope of Work',a.[karyarambhadesh] as 'Work Order',a.[NividaKrmank] as 'Tender No',cast(a.[NividaAmt] as decimal(10,2)) as 'Tender Amount',a.[NividaDate] as 'Tender Date',a.[kamachiMudat] as 'Work Order Date',a.[KamPurnDate] as 'Work Completion Date',b.[MudatVadhiDate] as 'Extension Month',a.[SanctionDate] as 'SanctionDate',a.[SanctionAmount] as 'SanctionAmount',b.[ManjurAmt] as 'Estimated Cost Approved',b.[MarchEndingExpn] as 'MarchEndingExpn 2021',b.[UrvaritAmt] as 'Remaining Cost',b.[VarshbharatilKharch] as 'Annual Expense',b.[Magilmonth] as 'Previous Month',b.[Magilkharch] as 'Previous Cost',b.[Chalumonth] as 'Current Month',b.[Chalukharch] as 'Current Cost',b.[AikunKharch] as 'Total Expense',b.[DTakunone] as 'First Provision Month',b.[Takunone] as 'First Provision',b.[DTakuntwo] as 'Second Provision Month',b.[Takuntwo] as 'Second Provision',b.[DTakunthree] as 'Third Provision Month',b.[Takunthree] as 'Third Provision',b.[DTakunfour] as 'Fourth Provision Month',b.[Takunfour] as 'Fourth Provision',b.[Tartud] as 'Grand Provision',b.[AkunAnudan] as 'Total Grand',b.[Magni] as 'Demand',b.[OtherExpen] as 'Other Expense',b.[ExpenCost] as 'Electricity Cost',b.[ExpenExpen] as 'Electricity Expense',a.[JobNo] as 'JobNo',a.[RoadNo] as 'Road Category',a.[RoadLength] as 'RoadLength',a.[APhysicalScope] as 'W.B.M Wide Phy Scope',a.[ACommulative] as 'W.B.M Wide Commulative',a.[ATarget] as 'W.B.M Wide Target',a.[AAchievement] as 'W.B.M Wide Achievement',a.[BPhysicalScope] as 'B.T Phy Scope',a.[BCommulative] as 'B.T Commulative',a.[BTarget] as 'B.T Target',a.[BAchievement] as 'B.T Achievement',a.[CPhysicalScope] as 'C.D Phy Scope',a.[CCommulative] as 'C.D Commulative',a.[CTarget] as 'C.D Target',a.[CAchievement] as 'C.D Achievement',a.[DPhysicalScope] as 'Minor Bridges Phy Scope(Nos)',a.[DCommulative] as 'Minor Bridges Commulative(Nos)',a.[DTarget] as 'Minor Bridges Target(Nos)',a.[DAchievement] as 'Minor Bridges Achievement(Nos)',a.[EPhysicalScope] as 'Major Bridges Phy Scope(Nos)',a.[ECommulative] as 'Major Bridges Commulative(Nos)',a.[ETarget] as 'Major Bridges Target(Nos)',a.[EAchievement] as 'Major Bridges Achievement(Nos)',b.[DeyakachiSadyasthiti] as 'Bill Status',a.[Pahanikramank] as 'Observation No',a.[PahaniMudye] as 'Observation Memo',CAST(CASE WHEN a.[Sadyasthiti] = 'Completed'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = 'Inprogress'  THEN 1 ELSE 0 END as decimal(10,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = 'Not Started'  THEN 1 ELSE 0 END as decimal(10,0)) as 'NS',CAST(CASE WHEN a.[Sadyasthiti] = 'Estimated Stage' THEN 1 ELSE 0 END as decimal(10,0)) as'ES',CAST(CASE WHEN a.[Sadyasthiti] = 'Tender Stage' THEN 1 ELSE 0 END as decimal(10,0)) as'TS',a.[Shera] as 'Remark',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterCRF as a join CRFProvision as b on a.WorkId=b.WorkId  where a.[LekhaShirshName]=N'(04) जिल्हा व इतर मार्ग केंद्रीय मार्ग  निधी'and a.[Arthsankalpiyyear]=N'2021-2023' and b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण' union select isNULL ('','')as'SrNo', 'Total' as 'WorkId',isNULL ('','') as 'U_WIN',isNULL ('','') as 'Budget of Item',isNULL (a.[Arthsankalpiyyear],'') as 'Arthsankalpiyyear',isNULL ('','') as 'Name of Work',isNULL ('','') as 'Head',isNULL ('','') as 'Headwise',isNULL ('','') as 'Type',isNULL ('','') as 'SubType',isNULL ('','') as 'Sub Division',isNULL ('','') as 'Taluka',isNULL ('','') as 'Sectional Engineer',isNULL ('','') as 'Deputy Engineer',isNULL ('','') as 'MLA',isNULL ('','') as 'MP',isNULL ('','') as 'Contractor',isNULL ('','') as 'Administrative No',isNULL ('','') as 'A A Date',sum(cast(a.[PrashaskiyAmt] as decimal(10,0))) as 'A A Amount',isNULL ('','') as 'Technical Sanction No',isNULL ('','') as 'T S Date',sum(cast(a.[TrantrikAmt]as decimal(10,0))) as 'T S Amount',isNULL ('','') as 'Scope of Work',isNULL ('','') as 'Work Order',isNULL ('','') as 'Tender No',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'Tender Amount',isNULL ('','') as 'Tender Date',isNULL ('','') as 'Work Order Date',isNULL ('','') as 'Work Completion Date',isNULL ('','') as 'Extension Month',isNULL ('','') as 'SanctionDate',sum(a.[SanctionAmount]) as 'SanctionAmount',sum(b.[ManjurAmt]) as 'Estimated Cost Approved',sum(b.[MarchEndingExpn]) as 'MarchEndingExpn 2021',sum(b.[UrvaritAmt]) as 'Remaining Cost',sum(b.[VarshbharatilKharch]) as 'Annual Expense',isNULL ('','') as 'Previous Month',sum(b.[Magilkharch]) as 'Previous Cost',isNULL ('','') as 'Current Month',sum(b.[Chalukharch]) as 'Current Cost',sum(b.[AikunKharch]) as 'Total Expense', isNULL ('','') as 'First Provision Month',sum(b.[Takunone]) as 'First Provision',isNULL ('','') as 'Second Provision Month',sum(b.[Takuntwo]) as 'Second Provision',isNULL ('','') as 'Third Provision Month',sum(b.[Takunthree]) as 'Third Provision',isNULL ('','') as 'Fourth Provision Month',sum(b.[Takunfour]) as 'Fourth Provision',sum(b.[Tartud]) as 'Grand Provision',sum(b.[AkunAnudan]) as 'Total Grand',sum(b.[Magni]) as 'Demand',sum(b.[OtherExpen]) as 'Other Expense',sum(b.[ExpenCost]) as 'Electricity Cost',sum(b.[ExpenExpen]) as 'Electricity Expense',isNULL ('','') as 'JobNo',isNULL ('','') as 'Road Category',isNULL ('','') as 'RoadLength',sum(a.[APhysicalScope]) as 'W.B.M Wide Phy Scope',sum(a.[ACommulative]) as 'W.B.M Wide Commulative',sum(a.[ATarget]) as 'W.B.M Wide Target',sum(a.[AAchievement]) as 'W.B.M Wide Achievement',sum(a.[BPhysicalScope]) as 'B.T Phy Scope',sum(a.[BCommulative]) as 'B.T Commulative',sum(a.[BTarget]) as 'B.T Target',sum(a.[BAchievement]) as 'B.T Achievement',sum(a.[CPhysicalScope]) as 'C.D Phy Scope',sum(a.[CCommulative]) as 'C.D Commulative',sum(a.[CTarget]) as 'C.D Target',sum(a.[CAchievement]) as 'C.D Achievement',sum(a.[DPhysicalScope]) as 'Minor Bridges Phy Scope(Nos)',sum(a.[DCommulative]) as 'Minor Bridges Commulative(Nos)',sum(a.[DTarget]) as 'Minor Bridges Target(Nos)',sum(a.[DAchievement]) as 'Minor Bridges Achievement(Nos)',sum(a.[EPhysicalScope]) as 'Major Bridges Phy Scope(Nos)',sum(a.[ECommulative]) as 'Major Bridges Commulative(Nos)',sum(a.[ETarget]) as 'Major Bridges Target(Nos)',sum(a.[EAchievement]) as 'Major Bridges Achievement(Nos)',isNULL ('','') as 'Bill Status',isNULL ('','') as 'Observation No',isNULL ('','') as 'Observation Memo',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Completed'  THEN 1 ELSE 0 END as decimal(10,0))) as 'C',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Inprogress'  THEN 1 ELSE 0 END as decimal(10,0))) as 'P',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Not Started'  THEN 1 ELSE 0 END as decimal(10,0))) as 'NS',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Estimated Stage'  THEN 1 ELSE 0 END as decimal(10,0))) as 'ES',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Tender Stage'  THEN 1 ELSE 0 END as decimal(10,0))) as 'TS',isNULL ('','') as 'Remark',sum(b.[Apr]) as 'Apr',sum(b.[May]) as 'May',sum(b.[Jun]) as 'Jun',sum(b.[Jul]) as 'Jul',sum(b.[Aug]) as 'Aug',sum(b.[Sep]) as 'Sep',sum(b.[Oct]) as 'Oct',sum(b.[Nov]) as 'Nov',sum(b.[Dec]) as 'Dec',sum(b.[Jan]) as 'Jan',sum(b.[Feb]) as 'Feb',sum(b.[Mar]) as 'Mar' from BudgetMasterCRF as a join CRFProvision as b on a.WorkId=b.WorkId  where a.[LekhaShirshName]=N'(04) जिल्हा व इतर मार्ग केंद्रीय मार्ग  निधी'and a.[Arthsankalpiyyear]=N'2021-2023' and b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण'  group by a.[Arthsankalpiyyear] order by a.[Arthsankalpiyyear],a.Upvibhag desc
        `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in CRFHEADWISEREPORT:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching CRFHEADWISEREPORT",
      error: error.message,
    });
  }
};

const NABARDHEADWISEREPORT = async (req, res) => {
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
SELECT ROW_NUMBER() OVER(PARTITION BY a.[RDF_SrNo] ORDER BY a.[Upvibhag]) as 'SrNo', a.[WorkId] as 'Work Id',a.[U_WIN] as 'U_WIN',a.[RDF_NO] as 'RIDF NO', a.[RDF_SrNo] as 'srno',a.[Arthsankalpiyyear] as 'Budget of Year',a.Dist as 'District',a.[Taluka] as 'Taluka',a.[ArthsankalpiyBab] as 'Budget of Item',a.[KamacheName]as 'Name of Work',a.[Kamachavav] as 'Scope of Work',a.[LekhaShirshName] as 'Headwise',a.[SubType] as 'Division',a.[Upvibhag] as 'Sub Division',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'Sectional Engineer',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'Deputy Engineer',a.[AmdaracheName] as 'MLA',a.[KhasdaracheName] as 'MP',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'Contractor',a.[PrashaskiyKramank] as 'Administrative No',a.[PrashaskiyDate] as 'A A Date',a.[PIC_NO] as 'PIC No',cast(a.[PrashaskiyAmt] as decimal(10,2)) as 'AA cost Rs in lakhs',cast(a.[TrantrikAmt]as decimal(10,2))as 'Technical Sanction Cost Rs in Lakh',a.[TrantrikKrmank]+' '+a.[TrantrikDate] as 'Technical Sanction No and Date',a.[NividaKrmank] as 'Tender No',cast(a.[NividaAmt] as decimal(10,2)) as 'Tender Amount',a.[karyarambhadesh] as 'Work Order',a.[NividaDate] as 'Tender Date',a.[kamachiMudat] as 'Work Order Date',a.[KamPurnDate] as 'Work Completion Date',b.[MudatVadhiDate] as 'Extension Month',b.[ManjurAmt] as 'Estimated Cost Approved',b.[MarchEndingExpn] as 'Expenditure up to MAR 2021',b.[UrvaritAmt] as 'Remaining Cost',b.[Chalukharch] as 'Current Cost',b.[Magilkharch] as 'Previous Cost',b.[VarshbharatilKharch] as 'Expenditure up to 8/2020 during year 20-21 Rs in Lakhs',b.[AikunKharch] as 'Total Expense',b.[Takunone] as 'Budget Provision in 2021-22 Rs in Lakhs',b.[Takuntwo] as 'Second Provision',b.[Takunthree] as 'Third Provision',b.[Takunfour] as 'Fourth Provision',b.[Tartud] as 'Total Provision',b.[AkunAnudan] as 'Total Grand',b.[Magni] as 'Demand for 2021-22 Rs in Lakhs',a.[PahaniMudye] as 'Observation Memo',a.[Pahanikramank] as 'Probable date of completion',b.[DeyakachiSadyasthiti] as 'Bill Status',a.[Sadyasthiti] as 'Physical Progress of work',a.[Road_No] as 'Road Category',a.[LengthRoad] as 'Road Length',a.[RoadType] as 'Road Type',a.[WBMI_km] as 'WBMI Km',a.[WBMII_km] as 'WBMII Km',a.[WBMIII_km] as 'WBMIII Km',a.[BBM_km] as 'BBM Km',a.[Carpet_km] as 'Carpet Km',a.[Surface_km] as 'Surface Km',cast(a.[CD_Works_No] as decimal(10,2))  as 'CD_Works_No',a.[PCR] as 'PCR submitted or not',a.[Shera] as 'Remark',CAST(CASE WHEN a.[Sadyasthiti] = 'Completed'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = 'Inprogress'  THEN 1 ELSE 0 END as decimal(10,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = 'Not Started'  THEN 1 ELSE 0 END as decimal(10,0)) as 'NS',CAST(CASE WHEN a.[Sadyasthiti] = 'Estimated Stage' THEN 1 ELSE 0 END as decimal(10,0)) as'ES',CAST(CASE WHEN a.[Sadyasthiti] = 'Tender Stage' THEN 1 ELSE 0 END as decimal(10,0)) as'TS',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'0' union select isNULL (a.[RDF_SrNo],'')as'SrNo',isNULL ('Total','') as 'Work Id',isNULL ('','') as 'U_WIN',isNULL ('','')as 'RIDF NO', cast(a.[RDF_SrNo] as int) as 'srno',isNULL ('Total','')as 'Budget of Year',isNULL ('','') as 'District',isNULL ('','') as 'Taluka',isNULL ('','') as 'Budget of Item',isNULL ('','')as 'Name of Work',isNULL ('','') as 'Scope of Work',isNULL ('','')as 'Headwise',isNULL ('','') as 'Division',isNULL ('','') as 'Sub Division',isNULL ('','') as 'Sectional Engineer',isNULL ('','') as 'Deputy Engineer',isNULL ('','') as 'MLA',isNULL ('','') as 'MP',isNULL ('','') as 'Contractor',isNULL ('','') as 'Administrative No',isNULL ('','') as 'A A Date','Total' as 'PIC No',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'AA cost Rs in lakhs',sum(cast(a.[TrantrikAmt]as decimal(10,2)))as 'Technical Sanction Cost Rs in Lakh',isNULL ('','') as 'Technical Sanction No and Date',isNULL ('','') as 'Tender No',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'Tender Amount',isNULL ('','') as 'Work Order',isNULL ('','') as 'Tender Date',isNULL ('','') as 'Work Order Date',isNULL ('','') as 'Work Completion Date',isNULL ('','') as 'Extension Month',sum(b.[ManjurAmt]) as 'Estimated Cost Approved',sum(b.[MarchEndingExpn]) as 'Expenditure up to MAR 2021',sum(b.[UrvaritAmt]) as 'Remaining Cost',sum(b.[Chalukharch]) as 'Current Cost',sum(b.[Magilkharch]) as 'Previous Cost',sum(b.[VarshbharatilKharch]) as 'Expenditure up to 8/2020 during year 20-21 Rs in Lakhs',sum(b.[AikunKharch]) as 'Total Expense', sum(b.[Takunone]) as 'Budget Provision in 2021-22 Rs in Lakhs',sum(b.[Takuntwo]) as 'Second Provision',sum(b.[Takunthree]) as 'Third Provision',sum(b.[Takunfour]) as 'Fourth Provision',sum(b.[Tartud]) as 'Total Provision',sum(b.[AkunAnudan]) as 'Total Grand',sum(b.[Magni]) as 'Demand for 2021-22 Rs in Lakhs',isNULL ('','') as 'Observation Memo',isNULL ('','') as 'Probable date of completion',isNULL ('','') as 'Bill Status',isNULL ('','') as 'Physical Progress of work',isNULL ('','') as 'Road Category',isNULL ('','') as 'Road Length',isNULL ('','') as 'Road Type',sum(a.[WBMI_km]) as 'WBMI Km',sum(a.[WBMII_km]) as 'WBMII Km',sum(a.[WBMIII_km]) as 'WBMIII Km',sum(a.[BBM_km]) as 'BBM Km',sum(a.[Carpet_km]) as 'Carpet Km',sum(a.[Surface_km]) as 'Surface Km',sum(cast(a.[CD_Works_No] as decimal(10,2)))  as 'CD_Works_No',isNULL ('','') as 'PCR submitted or not',isNULL ('','')as 'Remark',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Completed'  THEN 1 ELSE 0 END as decimal(10,0))) as 'C',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Inprogress'  THEN 1 ELSE 0 END as decimal(10,0))) as 'P',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Not Started'  THEN 1 ELSE 0 END as decimal(10,0))) as 'NS',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Estimated Stage'  THEN 1 ELSE 0 END as decimal(10,0))) as 'ES',sum(CAST(CASE WHEN a.[Sadyasthiti] = 'Tender Stage'  THEN 1 ELSE 0 END as decimal(10,0))) as 'TS',sum(b.[Apr]) as 'Apr',sum(b.[May]) as 'May',sum(b.[Jun]) as 'Jun',sum(b.[Jul]) as 'Jul',sum(b.[Aug]) as 'Aug',sum(b.[Sep]) as 'Sep',sum(b.[Oct]) as 'Oct',sum(b.[Nov]) as 'Nov',sum(b.[Dec]) as 'Dec',sum(b.[Jan]) as 'Jan',sum(b.[Feb]) as 'Feb',sum(b.[Mar]) as 'Mar' from BudgetMasterNABARD as a join NABARDProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'0'  group by a.[RDF_SrNo] order by a.[RDF_SrNo],a.[Arthsankalpiyyear],a.[Upvibhag],a.taluka      
  `;
    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in NABARDHEADWISEREPORT:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching NABARDHEADWISEREPORT",
      error: error.message,
    });
  }
};

const SHDORHEADWISEREPORT = async (req, res) => {
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
SELECT ROW_NUMBER() OVER(PARTITION BY a.[LekhaShirshName]ORDER BY a.LekhaShirshName desc,a.[Arthsankalpiyyear],a.[Taluka],a.[upvibhag]) as 'अ.क्र', a.[WorkId] as 'वर्क आयडी',a.[U_WIN] as 'U_WIN',a.PageNo as 'पान क्र',a.ArthsankalpiyBab as 'बाब क्र',a.JulyBab as 'जुलै/ बाब क्र./पान क्र.',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[KamacheName] as 'कामाचे नाव',a.[LekhaShirshName] as 'लेखाशीर्ष नाव',a.[SubType] as 'विभाग',a.[Upvibhag] as 'उपविभाग',a.[Taluka] as 'तालुका',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',a.[AmdaracheName] as 'आमदारांचे नाव',a.[KhasdaracheName] as 'खासदारांचे नाव',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',convert(nvarchar(max),a.[PrashaskiyAmt])as 'प्रशासकीय मान्यता रक्कम',convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[TrantrikAmt])as 'तांत्रिक मान्यता रक्कम',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',a.[Kamachevav] as 'कामाचा वाव',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'कार्यारंभ आदेश',cast(a.[NividaAmt] as decimal(10,2)) as 'निविदा रक्कम % कमी / जास्त',a.[kamachiMudat] as 'बांधकाम कालावधी',a.[KamPurnDate] as 'काम पूर्ण तारीख',CAST(CASE WHEN b.[MudatVadhiDate] = ' ' or b.[MudatVadhiDate] = '0' THEN N'होय' ELSE N'नाही' END as nvarchar(max)) as 'मुदतवाढ बाबत',b.[ManjurAmt] as 'मंजूर अंदाजित किंमत',b.[MarchEndingExpn] as 'सुरवाती पासून मार्च 2021 अखेरचा खर्च',b.[UrvaritAmt] as 'उर्वरित किंमत',b.[VarshbharatilKharch] as 'सन 2021-22 मधील माहे एप्रिल/मे अखेरचा खर्च',b.[Magilkharch] as 'मागील खर्च',b.[AikunKharch] as 'एकुण कामावरील खर्च',b.[Takunone] as'2021-22 मधील अर्थसंकल्पीय तरतूद मार्च 2021',b.[Takuntwo] as '2021-22 मधील अर्थसंकल्पीय तरतूद जुलै 2021',b.[Takunthree] as'तृतीय तिमाही तरतूद',b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',b.[Tartud] as 'एकूण अर्थसंकल्पीय तरतूद',b.[AkunAnudan] as '2021-22 मधील वितरीत तरतूद',b.[Magni] as '2021-22 साठी मागणी',b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',b.[Itarkhrch] as 'इतर खर्च',b.[Dviguni] as 'दवगुनी ज्ञापने',a.[PahaniMudye] as 'पाहणीमुद्ये',a.[Pahanikramank] as 'पाहणी क्रमांक',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0)) as 'P',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0)) as 'NS',CAST(CASE WHEN a.[Sadyasthiti] = N'अंदाजपत्रकिय स्तर' THEN 1 ELSE 0 END as decimal(10,0)) as'ES',CAST(CASE WHEN a.[Sadyasthiti] = N'निविदा स्तर' THEN 1 ELSE 0 END as decimal(10,0)) as'TS',convert(nvarchar(max),a.[Sadyasthiti])+' '+convert(nvarchar(max),a.[Shera]) as 'शेरा',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterRoad as a join RoadProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण' union select isNULL ('','')as'अ.क्र', 'Total' as 'वर्क आयडी',isNULL ('','') as 'U_WIN',isNULL ('','') as 'पान क्र',isNULL ('','') as 'बाब क्र',isNULL ('','') as 'जुलै/ बाब क्र./पान क्र.',isNULL ('Total','') as 'अर्थसंकल्पीय वर्ष',isNULL ('','') as 'कामाचे नाव', a.[LekhaShirshName] as 'लेखाशीर्ष नाव',isNULL ('','') as 'विभाग',isNULL ('','') as 'उपविभाग',isNULL ('','') as 'तालुका',isNULL ('','') as 'शाखा अभियंता नाव',isNULL ('','') as 'उपअभियंता नाव',isNULL ('','') as 'आमदारांचे नाव',isNULL ('','') as 'खासदारांचे नाव',isNULL ('','') as 'ठेकेदार नाव',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'प्रशासकीय मान्यता रक्कम',isNULL ('','') as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',sum(cast(a.[TrantrikAmt] as decimal(10,2))) as 'तांत्रिक मान्यता रक्कम',isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'कामाचा वाव',isNULL ('','') as 'कार्यारंभ आदेश',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'निविदा रक्कम % कमी / जास्त',isNULL ('','') as 'बांधकाम कालावधी',isNULL ('','') as 'काम पूर्ण तारीख',isNULL ('','') as 'मुदतवाढ बाबत',sum(b.[ManjurAmt]) as 'मंजूर अंदाजित किंमत',sum(b.[MarchEndingExpn]) as 'सुरवाती पासून मार्च 2021 अखेरचा खर्च',sum(b.[UrvaritAmt]) as 'उर्वरित किंमत',sum(b.[VarshbharatilKharch]) as 'सन 2021-22 मधील माहे एप्रिल/मे अखेरचा खर्च',sum(b.[Magilkharch]) as 'मागील खर्च ',sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',sum(b.[Takunone]) as'2021-22 मधील अर्थसंकल्पीय तरतूद मार्च 2021',sum(b.[Takuntwo]) as '2021-22 मधील अर्थसंकल्पीय तरतूद जुलै 2021',sum(b.[Takunthree]) as'तृतीय तिमाही तरतूद',sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद',sum(b.[Tartud]) as 'एकूण अर्थसंकल्पीय तरतूद',sum(b.[AkunAnudan]) as '2021-22 मधील वितरीत तरतूद',sum(b.[Magni]) as '2021-22 साठी मागणी',sum(b.[Vidyutprama]) as 'प्रमा',sum(b.[Vidyutvitarit]) as 'वितरित',sum(b.[Itarkhrch]) as 'इतर खर्च',isNULL ('','') as 'दवगुनी ज्ञापने',isNULL ('','') as 'पाहणीमुद्ये',isNULL ('','') as 'पाहणी क्रमांक',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0))) as 'C',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'प्रगतीत'  THEN 1 ELSE 0 END as decimal(10,0))) as 'P',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0))) as 'NS',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'अंदाजपत्रकिय स्तर'  THEN 1 ELSE 0 END as decimal(10,0))) as 'ES',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'निविदा स्तर'  THEN 1 ELSE 0 END as decimal(10,0))) as 'TS',isNULL ('','') as 'शेरा',sum (b.[Apr]) as [Apr],sum (b.[May]) as [May],sum (b.[Jun]) as [Jun],sum (b.[Jul]) as [Jul],sum (b.[Aug]) as [Aug],sum (b.[Sep]) as [Sep],sum (b.[Oct]) as [Oct],sum (b.[Nov]) as [Nov],sum (b.[Dec]) as [Dec],sum (b.[Jan]) as [Jan],sum (b.[Feb]) as [Feb],sum (b.[Mar]) as [Mar] from BudgetMasterRoad as a join RoadProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण'  group by a.[LekhaShirshName] order by a.[LekhaShirshName],a.[Arthsankalpiyyear],a.[upvibhag]
        `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in SHDORHEADWISEREPORT:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching SHDORHEADWISEREPORT",
      error: error.message,
    });
  }
};

const DPDCHEADWISEREPORT = async (req, res) => {
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
SELECT ROW_NUMBER() OVER(PARTITION BY a.[Arthsankalpiyyear], a.[Upvibhag] ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka]desc) as 'SrNo', a.[WorkId] as 'वर्क आयडी',a.[U_WIN] as 'U_WIN',a.[LekhaShirshName] as 'योजनेचे नाव',b.[ComputerCRC] as 'सीआरसी (संगणक) संकेतांक',b.[ObjectCode] as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',a.[Arthsankalpiyyear] as 'अर्थसंकल्पीय वर्ष',a.[KamacheName] as 'योजनेचे / कामाचे नांव',a.[SubType] as 'विभाग',a.[Upvibhag] as 'उपविभाग',a.[Taluka] as 'तालुका',a.[ArthsankalpiyBab] as 'अर्थसंकल्पीय बाब',convert(nvarchar(max),a.[ShakhaAbhyantaName])+' '+convert(nvarchar(max),a.[ShakhaAbhiyantMobile]) as 'शाखा अभियंता नाव',convert(nvarchar(max),a.[UpabhyantaName])+' '+convert(nvarchar(max),a.[UpAbhiyantaMobile]) as 'उपअभियंता नाव',a.[AmdaracheName] as 'आमदारांचे नाव',a.[KhasdaracheName] as 'खासदारांचे नाव',convert(nvarchar(max),a.[ThekedaarName])+' '+convert(nvarchar(max),a.[ThekedarMobile]) as 'ठेकेदार नाव',convert(nvarchar(max),a.[PrashaskiyAmt])as 'प्रशासकीय मान्यता रक्कम',convert(nvarchar(max),a.[PrashaskiyKramank])+' '+convert(nvarchar(max),a.[PrashaskiyAmt])+' '+convert(nvarchar(max),a.[PrashaskiyDate])as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',convert(nvarchar(max),a.[TrantrikAmt])as 'तांत्रिक मान्यता रक्कम',convert(nvarchar(max),a.[TrantrikKrmank])+' '+convert(nvarchar(max),a.[TrantrikAmt])+' '+convert(nvarchar(max),a.[TrantrikDate])as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',a.[Kamachevav] as 'कामाचा वाव',a.[karyarambhadesh] as 'कार्यारंभ आदेश',convert(nvarchar(max),a.[NividaKrmank])+' '+convert(nvarchar(max),a.[NividaDate])as 'निविदा क्र/दिनांक',cast(a.[NividaAmt] as decimal(10,2)) as 'निविदा रक्कम % कमी / जास्त',a.[kamachiMudat] as 'बांधकाम कालावधी',a.[KamPurnDate] as 'काम पूर्ण होण्याचा अपेक्षित दिनांक',convert(nvarchar(max),a.[NividaAmt])+' '+convert(nvarchar(max),b.[MudatVadhiDate]) as 'सुधारित अंदाजित किंमतीचा दिनांक',CAST(CASE WHEN a.[LekhaShirsh] = N'५०५४४२४६'  THEN '1' END as nvarchar(max)) as 'एकूण कामे',b.[DeyakachiSadyasthiti] as 'देयकाची सद्यस्थिती',b.[ManjurAmt] as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',b.[MarchEndingExpn] as 'मार्च अखेर खर्च 2021',b.[UrvaritAmt] as 'सन 2021-2022 मधील अपेक्षित खर्च',b.[Chalukharch] as 'चालू खर्च',b.[Magilkharch] as 'मागील खर्च',b.[VarshbharatilKharch] as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',b.[AikunKharch] as 'एकुण कामावरील खर्च',b.[Takunone] as 'उर्वरित किंमत (6-(8+9))',b.[Takuntwo] as 'द्वितीय तिमाही तरतूद',b.[Takunthree] as 'तृतीय तिमाही तरतूद',b.[Takunfour] as 'चतुर्थ तिमाही तरतूद',b.[Tartud] as '2021-2022 करीता प्रस्तावित तरतूद',b.[Tartud]as 'काम निहाय तरतूद सन 2021-2022',b.[AkunAnudan] as 'वितरित तरतूद',b.[Magni] as 'मागणी 2021-2022',b.[Vidyutprama] as 'विद्युतीकरणावरील प्रमा',b.[Vidyutvitarit] as 'विद्युतीकरणावरील वितरित',b.[Jun] as 'वितरीत तरतूद सन 2021-2022',b.[Itarkhrch] as 'इतर खर्च',b.[Dviguni] as 'दवगुनी ज्ञापने',a.[PahaniMudye] as 'पाहणीमुद्ये',CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0)) as 'C',CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0)) as 'NS',CAST(CASE WHEN a.[Sadyasthiti] = N'अंदाजपत्रकिय स्तर' THEN 1 ELSE 0 END as decimal(10,0)) as'ES',CAST(CASE WHEN a.[Sadyasthiti] = N'निविदा स्तर' THEN 1 ELSE 0 END as decimal(10,0)) as'TS',a.[Shera] as 'शेरा',b.[Apr] as 'Apr',b.[May] as 'May',b.[Jun] as 'Jun',b.[Jul] as 'Jul',b.[Aug] as 'Aug',b.[Sep] as 'Sep',b.[Oct] as 'Oct',b.[Nov] as 'Nov',b.[Dec] as 'Dec',b.[Jan] as 'Jan',b.[Feb] as 'Feb',b.[Mar] as 'Mar' from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण' union select isNULL ('','')as'SrNo',  'Total' as 'वर्क आयडी',isNULL ('','') as 'U_WIN', isNULL ('','') as 'योजनेचे नाव',isNULL ('','') as 'सीआरसी (संगणक) संकेतांक',isNULL ('','') as 'उद्यीष्ट संकेतांक(ऑब्जेक्ट कोड)',isNULL (a.[Arthsankalpiyyear],'') as 'अर्थसंकल्पीय वर्ष',isNULL ('','') as 'योजनेचे / कामाचे नांव',isNULL ('','') as 'विभाग', isNULL (a.[Upvibhag],'') as 'उपविभाग', isNULL ('','') as 'तालुका',isNULL ('','') as 'अर्थसंकल्पीय बाब',isNULL ('','') as 'शाखा अभियंता नाव',isNULL ('','') as 'उपअभियंता नाव',isNULL ('','') as 'आमदारांचे नाव',isNULL ('','') as 'खासदारांचे नाव',isNULL ('','') as 'ठेकेदार नाव',sum(cast(a.[PrashaskiyAmt] as decimal(10,2))) as 'प्रशासकीय मान्यता रक्कम', isNULL ('','')as 'प्रशासकीय मान्यता क्र/रक्कम/दिनांक',sum(cast(a.[TrantrikAmt] as decimal(10,2))) as 'तांत्रिक मान्यता रक्कम', isNULL ('','') as 'तांत्रिक मान्यता क्र/रक्कम/दिनांक',isNULL ('','') as 'कामाचा वाव',isNULL ('','') as 'कार्यारंभ आदेश',isNULL ('','') as 'निविदा क्र/दिनांक',sum(cast(a.[NividaAmt] as decimal(10,2))) as 'निविदा रक्कम % कमी / जास्त',isNULL ('','') as 'बांधकाम कालावधी', isNULL ('','') as 'काम पूर्ण होण्याचा अपेक्षित दिनांक', isNULL ('','') as 'सुधारित अंदाजित किंमतीचा दिनांक',isNULL ('','') as 'एकूण कामे',isNULL ('','') as 'देयकाची सद्यस्थिती',sum(b.[ManjurAmt]) as 'एकूण अंदाजित किंमत (अलिकडील सुधारित)',sum(b.[MarchEndingExpn]) as 'मार्च अखेर खर्च 2021', sum(b.[UrvaritAmt]) as 'सन 2021-2022 मधील अपेक्षित खर्च',sum(b.[Chalukharch])as 'चालू खर्च', sum(b.[Magilkharch]) as 'मागील खर्च',sum(b.[VarshbharatilKharch]) as 'सन 2021-2022 मधील माहे एप्रिल/मे अखेरचा खर्च',sum(b.[AikunKharch]) as 'एकुण कामावरील खर्च',sum(b.[Takunone]) as 'उर्वरित किंमत (6-(8+9))',sum(b.[Takuntwo]) as 'द्वितीय तिमाही तरतूद',sum(b.[Takunthree]) as 'तृतीय तिमाही तरतूद',sum(b.[Takunfour]) as 'चतुर्थ तिमाही तरतूद', sum(b.[Tartud]) as '2021-2022 करीता प्रस्तावित तरतूद', sum(b.[Tartud]) as 'काम निहाय तरतूद सन 2021-2022',sum(b.[AkunAnudan]) as 'वितरित तरतूद', sum(b.[Magni]) as 'मागणी 2021-2022',sum(b.[Vidyutprama]) as 'प्रमा',sum(b.[Vidyutvitarit]) as 'वितरित',sum(b.[Jun]) as 'वितरीत तरतूद सन 2021-2022',sum(b.[Itarkhrch]) as 'इतर खर्च',isNULL ('','') as 'दवगुनी ज्ञापने',isNULL ('','') as 'पाहणीमुद्ये',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'पूर्ण'  THEN 1 ELSE 0 END as decimal(10,0))) as 'C',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'सुरू न झालेली'  THEN 1 ELSE 0 END as decimal(10,0))) as 'NS',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'अंदाजपत्रकिय स्तर'  THEN 1 ELSE 0 END as decimal(10,0))) as 'ES',sum(CAST(CASE WHEN a.[Sadyasthiti] = N'निविदा स्तर'  THEN 1 ELSE 0 END as decimal(10,0))) as 'TS', isNULL ('','') as 'शेरा',sum (b.[Apr]) as [Apr],sum (b.[May]) as [May],sum (b.[Jun]) as [Jun],sum (b.[Jul]) as [Jul],sum (b.[Aug]) as [Aug],sum (b.[Sep]) as [Sep],sum (b.[Oct]) as [Oct],sum (b.[Nov]) as [Nov],sum (b.[Dec]) as [Dec],sum (b.[Jan]) as [Jan],sum (b.[Feb]) as [Feb],sum (b.[Mar]) as [Mar] from BudgetMasterDPDC as a join DPDCProvision as b on a.WorkId=b.WorkId where b.[Arthsankalpiyyear]=N'2023-2024'and a.[Sadyasthiti]=N'पूर्ण'  group by a.[Arthsankalpiyyear], a.[Upvibhag]  ORDER BY a.[Arthsankalpiyyear],a.[upvibhag],a.[Taluka] desc
        `;

    const result = await pool.request().query(query);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in DPDCHEADWISEREPORT:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching DPDCHEADWISEREPORT",
      error: error.message,
    });
  }
};

module.exports = {
  BUILDINGHEADWISEREPORT,
  DPDCHEADWISEREPORT,
  SHDORHEADWISEREPORT,
  NABARDHEADWISEREPORT,
  CRFHEADWISEREPORT,
};
