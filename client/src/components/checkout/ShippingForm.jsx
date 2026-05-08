import Input from '../ui/Input';

export default function ShippingForm({ data, errors, onChange, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-charcoal-900 dark:text-zinc-50 text-lg">Dirección de envío</h2>

      <Input
        id="shipping-name"
        name="name"
        label="Nombre completo"
        placeholder="Juan García"
        value={data.name}
        onChange={handleChange}
        error={errors?.name}
        autoComplete="name"
        disabled={disabled}
      />

      <Input
        id="shipping-address"
        name="address"
        label="Dirección"
        placeholder="3ra Calle 5-23, Zona 1"
        value={data.address}
        onChange={handleChange}
        error={errors?.address}
        autoComplete="street-address"
        disabled={disabled}
      />

      <Input
        id="shipping-city"
        name="city"
        label="Ciudad / Municipio"
        placeholder="Puerto Barrios, Izabal"
        value={data.city}
        onChange={handleChange}
        error={errors?.city}
        autoComplete="address-level2"
        disabled={disabled}
      />

      <Input
        id="shipping-phone"
        name="phone"
        type="tel"
        label="Teléfono de contacto"
        placeholder="+502 1234 5678"
        value={data.phone}
        onChange={handleChange}
        error={errors?.phone}
        autoComplete="tel"
        disabled={disabled}
      />
    </div>
  );
}
