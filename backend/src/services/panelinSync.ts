import { prisma } from "../lib/prisma";
import { panelin } from "../lib/panelin";

export async function syncServices(): Promise<{ synced: number }> {
  const { data: res } = await panelin.get("/services");
  const raw = res.data;
  const services = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];

  if (!services.length) return { synced: 0 };

  await prisma.$transaction(
    services.map((s: any) =>
      prisma.panelinService.upsert({
        where: { id: s.id },
        create: {
          id:          s.id,
          name:        s.name,
          description: s.description ?? null,
          category:    s.category,
          type:        s.type,
          rate:        s.rate,
          min:         s.min,
          max:         s.max,
          dripfeed:    s.dripfeed,
          refill:      s.refill,
          cancel:      s.cancel,
        },
        update: {
          name:        s.name,
          description: s.description ?? null,
          category:    s.category,
          type:        s.type,
          rate:        s.rate,
          min:         s.min,
          max:         s.max,
          dripfeed:    s.dripfeed,
          refill:      s.refill,
          cancel:      s.cancel,
          syncedAt:    new Date(),
        },
      })
    )
  );

  return { synced: services.length };
}

export async function syncOrders(): Promise<{ synced: number }> {
  let page = 1;
  let totalSynced = 0;

  while (true) {
    const { data: res } = await panelin.get(`/orders?page=${page}`);
    const orders: any[] = res.data ?? [];
    if (!orders.length) break;

    await prisma.$transaction(
      orders.map((o: any) =>
        prisma.panelinOrder.upsert({
          where: { id: o.id },
          create: {
            id:         o.id,
            serviceId:  o.service_id,
            link:       o.link ?? null,
            quantity:   o.quantity,
            rate:       o.rate,
            charge:     o.charge,
            startCount: o.start_count ?? null,
            remains:    o.remains ?? null,
            status:     o.status?.toLowerCase() ?? o.status,
            comments:   o.comments ?? null,
            orderDate:  new Date(o.created_at),
          },
          update: {
            status:     o.status?.toLowerCase() ?? o.status,
            startCount: o.start_count ?? null,
            remains:    o.remains ?? null,
            syncedAt:   new Date(),
          },
        })
      )
    );

    totalSynced += orders.length;
    if (!res.meta || page >= res.meta.last_page) break;
    page++;
  }

  return { synced: totalSynced };
}

// Sync hanya order yang masih aktif (pending/processing/in_progress)
export async function syncActiveOrders(): Promise<{ synced: number }> {
  const active = await prisma.panelinOrder.findMany({
    where: { status: { in: ["pending", "processing", "in_progress"] } },
    select: { id: true },
  });

  if (!active.length) return { synced: 0 };

  let synced = 0;
  for (const { id } of active) {
    try {
      const { data: res } = await panelin.get(`/orders/${id}`);
      const o = res.data;

      await prisma.panelinOrder.update({
        where: { id },
        data: { status: o.status?.toLowerCase() ?? o.status, startCount: o.start_count ?? null, remains: o.remains ?? null, syncedAt: new Date() },
      });

      // ── Refund token jika order selesai dengan status cancelled/partial ──
      if (["cancelled", "partial"].includes(o.status)) {
        await processTokenRefund(id, o.status, o.quantity, o.remains ?? 0);
      }

      synced++;
    } catch {
      // order mungkin sudah tidak ada, skip
    }
  }

  return { synced };
}

async function processTokenRefund(orderId: number, status: string, quantity: number, remains: number) {
  // Cek apakah sudah ada REFUND untuk order ini
  const existingRefund = await prisma.tokenTransaction.findFirst({
    where: { orderId, type: "REFUND" },
  });
  if (existingRefund) return; // sudah direfund sebelumnya

  // Cari transaksi ORDER asli
  const orderTx = await prisma.tokenTransaction.findFirst({
    where: { orderId, type: "ORDER" },
  });
  if (!orderTx || !orderTx.tokenPrice) return; // bukan order dari user bertoken

  let refundAmount = 0;
  if (status === "cancelled") {
    refundAmount = orderTx.amount; // full refund
  } else if (status === "partial" && remains > 0) {
    // Proporsional: (sisa / total) × token yang dibayar
    refundAmount = Math.ceil((remains / quantity) * orderTx.amount);
  }

  if (refundAmount <= 0) return;

  const user = await prisma.user.findUnique({ where: { id: orderTx.userId }, select: { tokenBalance: true } });
  if (!user) return;

  const before = user.tokenBalance;
  const after  = before + refundAmount;

  await prisma.$transaction([
    prisma.tokenTransaction.create({
      data: { userId: orderTx.userId, type: "REFUND", amount: refundAmount, balanceBefore: before, balanceAfter: after, orderId, serviceId: orderTx.serviceId, tokenPrice: orderTx.tokenPrice, note: `Refund ${status} order #${orderId}` },
    }),
    prisma.user.update({ where: { id: orderTx.userId }, data: { tokenBalance: after } }),
  ]);
}

export async function syncTransactions(): Promise<{ synced: number }> {
  // Cari ID transaksi terbesar yang sudah ada di DB
  const latest = await prisma.panelinTransaction.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const latestId = latest?.id ?? 0;

  let page = 1;
  let totalSynced = 0;
  let reachedExisting = false;

  while (!reachedExisting) {
    const { data: res } = await panelin.get(`/transactions?page=${page}`);
    const txs: any[] = res.data ?? [];
    if (!txs.length) break;

    const newTxs = txs.filter((t: any) => t.id > latestId);
    if (newTxs.length < txs.length) reachedExisting = true;

    if (newTxs.length) {
      await prisma.$transaction(
        newTxs.map((t: any) =>
          prisma.panelinTransaction.upsert({
            where: { id: t.id },
            create: {
              id:              t.id,
              type:            t.type ?? null,
              amount:          t.amount,
              balanceBefore:   t.balance_before ?? null,
              balanceAfter:    t.balance_after  ?? null,
              description:     t.description    ?? null,
              transactionDate: new Date(t.created_at),
            },
            update: {},
          })
        )
      );
      totalSynced += newTxs.length;
    }

    if (!res.meta || page >= res.meta.last_page) break;
    page++;
  }

  return { synced: totalSynced };
}
