import React, { useEffect, useMemo, useState } from "react";
import "./invoiceList.css";
import apis from "../utils/apis";
import httpAction from "../utils/httpAction";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaUser,
  FaPhoneAlt,
  FaMoneyBillWave,
  FaBoxOpen,
  FaCalendarAlt,
  FaHashtag,
  FaBuilding,
  FaRegStickyNote,
} from "react-icons/fa";
import { MdOutlineReceiptLong } from "react-icons/md";
import { HiOutlineSearch } from "react-icons/hi";

const InvoiceList = () => {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | sale | purchase

  // ✅ Date filters
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState(""); // yyyy-mm-dd
  const [dateError, setDateError] = useState("");

  const getList = async () => {
    const payload = { url: apis().invoiceList };
    const result = await httpAction(payload);
    if (result?.status) {
      setData(result?.list || []);
    }
  };

  useEffect(() => {
    getList();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const money = (n) => {
    const num = Number(n);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString();
  };

  const computeInvoice = (inv) => {
    const d = inv?.data || {};
    const qty = Number(d.quantity || 0);
    const purchase = Number(d.purchase || 0);
    const sale = Number(d.sale || 0);
    const saleType = d.saleType;

    const totalSale = saleType === "sale" ? sale * qty : 0;
    const totalPurchase = purchase * qty;

    const profit = saleType === "sale" ? (sale - purchase) * qty : 0;

    return { totalSale, totalPurchase, profit };
  };

  // ✅ Date validation: end must be >= start (and handle empty safely)
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) setDateError("End date must be greater than Start date");
      else setDateError("");
    } else {
      setDateError("");
    }
  }, [startDate, endDate]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;

    // end date کو inclusive کرنے کیلئے end-of-day
    if (e) e.setHours(23, 59, 59, 999);

    return (data || []).filter((inv) => {
      const d = inv?.data || {};
      const u = inv?.user || {};

      // type filter
      const matchesType =
        typeFilter === "all" ? true : d.saleType === typeFilter;

      // text search
      const haystack = [
        inv?._id,
        d?.saleType,
        d?.clientName,
        d?.clientMobile,
        d?.clientRefrence,
        d?.comments,
        u?.name,
        u?.mobile,
        u?.estate,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = query ? haystack.includes(query) : true;

      // date filter
      if (dateError) return false; // invalid range => no results

      const created = inv?.createdAt ? new Date(inv.createdAt) : null;

      const matchesStart = s && created ? created >= s : true;
      const matchesEnd = e && created ? created <= e : true;

      return matchesType && matchesQuery && matchesStart && matchesEnd;
    });
  }, [data, q, typeFilter, startDate, endDate, dateError]);

  // ✅ Top summary values based on filtered
  const summary = useMemo(() => {
    let totalSale = 0;
    let totalPurchase = 0;
    let totalProfit = 0;
    let totalQty = 0;

    for (const inv of filtered) {
      const calc = computeInvoice(inv);
      totalSale += calc.totalSale;
      totalPurchase += calc.totalPurchase;
      totalProfit += calc.profit;

      const qty = Number(inv?.data?.quantity || 0);
      totalQty += Number.isNaN(qty) ? 0 : qty;
    }

    return { totalSale, totalPurchase, totalProfit, totalQty };
  }, [filtered]);

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    setDateError("");
  };

  const formatDMY = (isoOrDate) => {
    if (!isoOrDate) return "-";
    const d = new Date(isoOrDate);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Optional: short date+time without seconds (but user wants short date, so using only DMY)
  const formatDMYNoSeconds = (isoOrDate) => formatDMY(isoOrDate);

  const getRangeLabelDMY = () => {
    if (!startDate && !endDate) return "All Dates";
    if (startDate && !endDate) return `From ${formatDMY(startDate)}`;
    if (!startDate && endDate) return `Upto ${formatDMY(endDate)}`;
    return `${formatDMY(startDate)} to ${formatDMY(endDate)}`;
  };

  const makeStatementPdf = () => {
    if (dateError) return;

    const doc = new jsPDF("l", "pt", "a4");
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const left = 40;
    const right = 40;

    // ===== Colors (soft, professional)
    const COLOR_DARK = [17, 24, 39];
    const COLOR_MUTED = [107, 114, 128];
    const COLOR_LINE = [229, 231, 235];
    const COLOR_ACCENT = [45, 75, 255]; // blue
    const COLOR_GREEN = [6, 95, 70]; // profit
    const COLOR_ORANGE = [249, 115, 22]; // qty
    const COLOR_TYPE_SALE = [16, 185, 129];
    const COLOR_TYPE_PURCHASE = [59, 130, 246];

    // ===== Helpers
    const safeNum = (v) => {
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    };

    const formatAmount = (value) => {
      const num = Number(value);
      if (Number.isNaN(num)) return "-";
      return num.toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    };

    const rs = (v) => `Rs ${formatAmount(v)}`;

    // ===== Header strip
    doc.setFillColor(246, 248, 251);
    doc.rect(0, 0, pageW, 92, "F");

    doc.setFillColor(...COLOR_ACCENT);
    doc.rect(0, 0, pageW, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...COLOR_DARK);
    doc.text("Invoice Statement", left, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`Date Range: ${getRangeLabelDMY()}`, left, 62);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLOR_DARK);
    doc.text(`Records: ${filtered.length}`, pageW - right, 40, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_MUTED);
    const typeText = `Type: ${
      typeFilter === "all" ? "All" : typeFilter.toUpperCase()
    }`;
    const searchText = `Search: ${q?.trim() ? q.trim() : "-"}`;
    doc.text(typeText, pageW - right, 62, { align: "right" });
    doc.text(searchText, pageW - right, 78, { align: "right" });

    // ===== Summary badges (4)
    const sumY = 110;
    const boxH = 40;
    const gap = 10;
    const boxW = (pageW - left - right - gap * 3) / 4;

    const drawBadge = (x, label, value, colorRGB) => {
      doc.setDrawColor(...COLOR_LINE);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, sumY, boxW, boxH, 10, 10, "FD");

      doc.setFillColor(...colorRGB);
      doc.circle(x + 12, sumY + 14, 4, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(label, x + 22, sumY + 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...COLOR_DARK);
      doc.text(value, x + 22, sumY + 34);
    };

    drawBadge(
      left + (boxW + gap) * 0,
      "Total Qty",
      String(money(summary.totalQty)),
      COLOR_ORANGE
    );
    drawBadge(
      left + (boxW + gap) * 1,
      "Total Purchase",
      rs(summary.totalPurchase),
      COLOR_TYPE_PURCHASE
    );
    drawBadge(
      left + (boxW + gap) * 2,
      "Total Sale",
      rs(summary.totalSale),
      COLOR_TYPE_SALE
    );
    drawBadge(
      left + (boxW + gap) * 3,
      "Total Profit",
      rs(summary.totalProfit),
      COLOR_GREEN
    );

    // ===== Cells (raw + display)
    const amountCell = (numVal) => ({
      content: formatAmount(numVal),
      raw: Number(numVal) || 0,
    });

    const rows = filtered.map((inv) => {
      const d = inv?.data || {};
      const qty = safeNum(d.quantity);
      const purchase = safeNum(d.purchase);
      const sale = safeNum(d.sale);
      const isSale = d.saleType === "sale";

      const profit = isSale ? (sale - purchase) * qty : 0;
      const txnTotal = isSale ? sale * qty : purchase * qty; // ✅ new

      return [
        { content: String(qty || 0), raw: qty || 0 }, // Qty
        { content: (d.saleType || "-").toUpperCase(), raw: d.saleType }, // ✅ Txn Type
        amountCell(purchase), // Purchase
        isSale ? amountCell(sale) : { content: "-", raw: null }, // Sale
        isSale ? amountCell(profit) : { content: "-", raw: null }, // Profit
        amountCell(txnTotal), // ✅ Txn Total
        formatDMYNoSeconds(inv?.createdAt), // Txn Date
        d.clientName || "-", // Client Name
        d.clientMobile || "-", // Client Mobile
        d.comments?.trim() ? d.comments.trim() : "—", // ✅ Remarks
      ];
    });

    // ===== Table (LANDSCAPE widths)
    autoTable(doc, {
      startY: 170,
      head: [
        [
          "Qty",
          "Txn Type",
          "Purchase",
          "Sale",
          "Profit",
          "Txn Total",
          "Txn Date",
          "Client Name",
          "Client Mobile",
          "Remarks",
        ],
      ],

      body: rows,

      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        textColor: COLOR_DARK,
        halign: "left",
        valign: "middle",
        overflow: "ellipsize",
        lineColor: COLOR_LINE,
        lineWidth: 0.5,
      },

      headStyles: {
        fillColor: COLOR_DARK,
        textColor: 255,
        fontStyle: "bold",
        halign: "left",
      },

      alternateRowStyles: { fillColor: [246, 248, 251] },

      // ✅ column widths for landscape (adjust if needed)

      columnStyles: {
        0: { cellWidth: 38 }, // Qty
        1: { cellWidth: 60 }, // Txn Type
        2: { cellWidth: 65 }, // Purchase (کم)
        3: { cellWidth: 65 }, // Sale (کم)
        4: { cellWidth: 75 }, // Profit
        5: { cellWidth: 80 }, // Txn Total
        6: { cellWidth: 65 }, // Txn Date
        7: { cellWidth: 85 }, // Client Name (کم)
        8: { cellWidth: 70 }, // Client Mobile
        9: { cellWidth: 170 }, // ✅ Remarks (زیادہ)
      },

      didParseCell: (hook) => {
        // Qty highlight
        if (hook.section === "body" && hook.column.index === 0) {
          hook.cell.styles.textColor = COLOR_ORANGE;
          hook.cell.styles.fontStyle = "bold";
        }

        // Txn Type badge-like color
        if (hook.section === "body" && hook.column.index === 1) {
          const rawType = hook.cell.raw?.raw;
          hook.cell.styles.fontStyle = "bold";
          hook.cell.styles.textColor =
            rawType === "sale" ? COLOR_TYPE_SALE : COLOR_TYPE_PURCHASE;
        }

        // Profit column one consistent green
        if (hook.section === "body" && hook.column.index === 4) {
          const raw = hook.cell.raw?.raw;
          if (raw !== null && raw !== undefined) {
            hook.cell.styles.textColor = COLOR_GREEN;
            hook.cell.styles.fontStyle = "bold";
          }
        }
      },

      didDrawPage: () => {
        doc.setDrawColor(...COLOR_LINE);
        doc.line(left, pageH - 52, pageW - right, pageH - 52);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLOR_MUTED);

        const footerLeft = `Range: ${getRangeLabelDMY()}`;
        const footerRight = `Generated: ${formatDMY(new Date())}`;

        doc.text(footerLeft, left, pageH - 34);
        doc.text(footerRight, pageW - right, pageH - 34, { align: "right" });

        const pageCount = doc.getNumberOfPages();
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLOR_DARK);
        doc.text(
          `Page ${pageCurrent} / ${pageCount}`,
          pageW - right,
          pageH - 18,
          {
            align: "right",
          }
        );
      },
    });

    const filename = `invoice-statement_${getRangeLabelDMY().replaceAll(
      " ",
      "_"
    )}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="invoiceList">
      {/* Header */}
      <div className="invoiceHeader">
        <div className="headerLeft">
          <div className="titleRow">
            <MdOutlineReceiptLong className="titleIcon" />
            <h2 className="title">Invoices</h2>
          </div>
          <p className="subtitle">
            Showing <b>{filtered.length}</b> invoices
          </p>
        </div>

        <div className="headerRight">
          <div className="searchBox">
            <HiOutlineSearch className="searchIcon" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by client, mobile, user, estate, id..."
            />
          </div>

          <div className="filterPills">
            <button
              className={`pill ${typeFilter === "all" ? "active" : ""}`}
              onClick={() => setTypeFilter("all")}
              type="button"
            >
              All
            </button>
            <button
              className={`pill ${typeFilter === "sale" ? "activeSale" : ""}`}
              onClick={() => setTypeFilter("sale")}
              type="button"
            >
              Sale
            </button>
            <button
              className={`pill ${
                typeFilter === "purchase" ? "activePurchase" : ""
              }`}
              onClick={() => setTypeFilter("purchase")}
              type="button"
            >
              Purchase
            </button>
          </div>

          <button className="refreshBtn" onClick={getList} type="button">
            Refresh
          </button>
        </div>
      </div>

      {/* ✅ Top Filter Bar: Date Range */}
      <div className="topControls">
        <div className="dateFilters">
          <div className="dateField">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate || undefined}
            />
          </div>

          <div className="dateField">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
            />
          </div>

          <button className="ghostBtn" type="button" onClick={clearDates}>
            Clear Dates
          </button>
          <button
            className="pdfBtn"
            type="button"
            onClick={makeStatementPdf}
            disabled={!!dateError || filtered.length === 0}
            title={dateError ? "Fix date range first" : "Download statement"}
          >
            Download Statement (PDF)
          </button>

          {dateError ? <div className="dateError">{dateError}</div> : null}
        </div>

        {/* ✅ Summary Cards */}
        <div className="summaryGrid">
          <div className="summaryCard saleSum">
            <div className="sumLabel">
              <FaMoneyBillWave /> Total Sale
            </div>
            <div className="sumValue">Rs {money(summary.totalSale)}</div>
          </div>

          <div className="summaryCard purchaseSum">
            <div className="sumLabel">
              <FaMoneyBillWave /> Total Purchase
            </div>
            <div className="sumValue">Rs {money(summary.totalPurchase)}</div>
          </div>

          <div className="summaryCard profitSum">
            <div className="sumLabel">
              <FaMoneyBillWave /> Total Profit
            </div>
            <div className="sumValue">Rs {money(summary.totalProfit)}</div>
          </div>
          <div className="summaryCard qtySum">
            <div className="sumLabel">
              <FaBoxOpen /> Total Quantity
            </div>
            <div className="sumValue">{money(summary.totalQty)}</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="invoiceGrid">
        {filtered.map((inv) => {
          const d = inv?.data || {};
          const u = inv?.user || {};

          const isSale = d.saleType === "sale";

          const qty = Number(d.quantity || 0);
          const purchase = Number(d.purchase || 0);
          const sale = Number(d.sale || 0);

          const grandTotal = isSale ? sale * qty : purchase * qty;
          const profit = isSale ? (sale - purchase) * qty : 0;

          return (
            <div key={inv._id} className="invoiceCard">
              <div className="cardTop">
                <div className="badgeWrap">
                  <span className={`badge ${isSale ? "sale" : "purchase"}`}>
                    {isSale ? "SALE" : "PURCHASE"}
                  </span>
                  <span className="date">
                    <FaCalendarAlt /> {formatDate(inv.createdAt)}
                  </span>
                </div>

                <div className="idRow" title={inv._id}>
                  <FaHashtag /> <span>{inv._id?.slice(-10)}</span>
                </div>
              </div>

              <div className="totalsRow">
                <div className="metric">
                  <div className="metricLabel">
                    <FaMoneyBillWave /> Grand Total
                  </div>
                  <div className="metricValue">Rs {money(grandTotal)}</div>
                </div>

                <div className={`metric ${isSale ? "profit" : "muted"}`}>
                  <div className="metricLabel">
                    <FaMoneyBillWave /> Profit
                  </div>
                  <div className="metricValue">
                    {isSale ? `Rs ${money(profit)}` : "-"}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="sectionTitle">Client</div>

                <div className="infoRow">
                  <FaUser className="rowIcon" />
                  <div className="rowText">
                    <span className="label">Name</span>
                    <span className="value">{d.clientName || "-"}</span>
                  </div>
                </div>

                <div className="infoRow">
                  <FaPhoneAlt className="rowIcon" />
                  <div className="rowText">
                    <span className="label">Mobile</span>
                    <span className="value">{d.clientMobile || "-"}</span>
                  </div>
                </div>

                <div className="infoRow">
                  <FaBuilding className="rowIcon" />
                  <div className="rowText">
                    <span className="label">Reference / Estate</span>
                    <span className="value">{d.clientRefrence || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="sectionTitle">Asset</div>

                <div className="kvGrid">
                  <div className="kv">
                    <span className="k">
                      <FaMoneyBillWave /> Purchase
                    </span>
                    <span className="v">Rs {money(d.purchase)}</span>
                  </div>

                  <div className={`kv ${isSale ? "" : "disabled"}`}>
                    <span className="k">
                      <FaMoneyBillWave /> Sale
                    </span>
                    <span className="v">
                      {isSale ? `Rs ${money(d.sale)}` : "-"}
                    </span>
                  </div>

                  <div className="kv">
                    <span className="k">
                      <FaBoxOpen /> Qty
                    </span>
                    <span className="v">{money(d.quantity)}</span>
                  </div>
                </div>
              </div>

              <div className="section noteSection">
                <div className="sectionTitle">
                  <FaRegStickyNote /> Comments
                </div>
                <p className="note">{d.comments?.trim() || "—"}</p>
              </div>

              <div className="cardFooter">
                <div className="assignedUser">
                  <span className="chip">
                    <FaUser /> {u.name || d.user || "Unknown User"}
                  </span>
                  {u.mobile ? (
                    <span className="chip ghost">
                      <FaPhoneAlt /> {u.mobile}
                    </span>
                  ) : null}
                  {u.estate ? (
                    <span className="chip ghost">
                      <FaBuilding /> {u.estate}
                    </span>
                  ) : null}
                </div>

                <button
                  className="miniBtn"
                  type="button"
                  onClick={() => navigator.clipboard.writeText(inv._id)}
                  title="Copy Invoice ID"
                >
                  Copy ID
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="emptyState">
            <div className="emptyCard">
              <MdOutlineReceiptLong className="emptyIcon" />
              <h3>No invoices found</h3>
              <p>Try changing search, filter or date range.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
