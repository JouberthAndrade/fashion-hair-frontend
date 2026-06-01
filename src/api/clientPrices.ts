import { api } from './client';
import type { ClientServicePrice, ResolvedClientPrice } from './types';

/** Lista o price book do cliente (preços por serviço). */
export async function listClientPrices(clientId: string): Promise<ClientServicePrice[]> {
  const { data } = await api.get<ClientServicePrice[]>(`/clients/${clientId}/prices`);
  return data;
}

/** Resolve o preço sugerido para (cliente, serviço): do book ou o padrão. */
export async function resolveClientPrice(
  clientId: string,
  serviceId: string,
): Promise<ResolvedClientPrice> {
  const { data } = await api.get<ResolvedClientPrice>(
    `/clients/${clientId}/prices/${serviceId}/resolve`,
  );
  return data;
}

/** Cria/atualiza o preço lembrado do cliente para um serviço. */
export async function upsertClientPrice(
  clientId: string,
  serviceId: string,
  price: number,
): Promise<ClientServicePrice> {
  const { data } = await api.put<ClientServicePrice>(
    `/clients/${clientId}/prices/${serviceId}`,
    { price },
  );
  return data;
}

/** Remove o preço lembrado (volta a sugerir o preço padrão do serviço). */
export async function deleteClientPrice(clientId: string, serviceId: string): Promise<void> {
  await api.delete(`/clients/${clientId}/prices/${serviceId}`);
}
